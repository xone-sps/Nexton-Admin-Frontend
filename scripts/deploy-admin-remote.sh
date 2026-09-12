#!/usr/bin/env bash
# Blue-green swap for the super-admin console (admin.nexton.work). Runs ON the
# server — piped in over `ssh <server> bash -s`, never executed locally.
#
# Used by BOTH .github/workflows/deploy.yml and the Makefile `deploy` target, so
# the two can never drift. Same scheme as the tenant portal's
# scripts/deploy-portal-remote.sh (nexton_web_admin) and the VPS's own
# /root/nexton/deploy-front.sh.
#
# The caller must have already rsynced the build into $RELEASE.
#
# Required env: NETWORK RELEASE CONTAINER PORT CURRENT_LINK NGINX
set -uo pipefail

NEW="${CONTAINER}-new"

# Health-check over the docker network from a throwaway busybox. Checking from
# inside the network is what proves the container is reachable the same way
# nginx will reach it — asking the container about itself does not.
wait_http() { # name port path
  local i
  for i in $(seq 1 20); do
    if docker run --rm --network "$NETWORK" busybox:1.36 \
        wget -q -T 4 -O /dev/null "http://$1:$2$3" 2>/dev/null; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if [ ! -f "$RELEASE/server.js" ]; then
  echo "staged release $RELEASE has no server.js — aborting, production untouched"
  rm -rf "$RELEASE"
  exit 1
fi

docker pull busybox:1.36 >/dev/null 2>&1 || true
docker rm -f "$NEW" >/dev/null 2>&1 || true

echo "[admin] starting $NEW on port $PORT ..."
docker run -d --name "$NEW" --network "$NETWORK" \
  -v "$RELEASE:/app" -w /app \
  -e PORT="$PORT" -e HOSTNAME=0.0.0.0 -e NODE_ENV=production -e NEXT_TELEMETRY_DISABLED=1 \
  --memory=256m --memory-swap=256m \
  --log-opt max-size=10m --log-opt max-file=3 \
  --health-cmd="wget -q -T4 -O /dev/null http://127.0.0.1:$PORT/ || exit 1" \
  --health-interval=30s --health-timeout=5s --health-retries=3 \
  --user node \
  --expose "$PORT" --restart unless-stopped \
  node:20-alpine node /app/server.js >/dev/null || {
    echo "[admin] could not start $NEW — old container still serving."
    rm -rf "$RELEASE"
    exit 1
  }

echo "[admin] health-checking $NEW ..."
if ! wait_http "$NEW" "$PORT" /; then
  echo "[admin] NEW RELEASE FAILED HEALTH CHECK — discarding it; old container keeps serving."
  docker logs --tail 40 "$NEW" 2>&1 || true
  docker rm -f "$NEW" >/dev/null 2>&1 || true
  rm -rf "$RELEASE"
  exit 1
fi

# Only now is the old one retired. Its release directory is deliberately left on
# disk as the rollback target; /root/nexton/prune-releases.sh ages it out.
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker rename "$NEW" "$CONTAINER"
mkdir -p "$(dirname "$CURRENT_LINK")"
ln -sfn "$RELEASE" "$CURRENT_LINK"
echo "[admin] swapped OK -> $RELEASE"

# nginx resolves upstreams by name at request time (variable proxy_pass +
# resolver), so it self-heals within the DNS TTL. A reload just makes the new
# container's IP take effect immediately.
if docker ps --format '{{.Names}}' | grep -qx "$NGINX"; then
  docker exec "$NGINX" nginx -s reload 2>/dev/null \
    || echo "[admin] nginx reload skipped — resolver self-heals within the DNS TTL."
fi

docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E "$CONTAINER|$NGINX|NAMES"
