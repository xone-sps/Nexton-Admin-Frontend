.PHONY: dev build deploy help

# ── Deployment ──────────────────────────────────────────────────
# nginx routes to the console by CONTAINER NAME (proxy_pass -> nexton-admin:3001,
# resolved per request), so CONTAINER and PORT are load-bearing.
SERVER := root@209.97.165.92
NETWORK := nexton_nexton
CONTAINER := nexton-admin
PORT := 3001
NGINX := nexton-nginx
RELEASES_DIR := /root/nexton/releases/admin
CURRENT_LINK := /root/nexton/current/admin
SSH_SOCK := /tmp/nexton-admin-deploy-ssh
SSH_OPTS := -o ControlMaster=auto -o ControlPath=$(SSH_SOCK) -o ControlPersist=300
SSH := ssh $(SSH_OPTS)

## dev: Start development server (port 3001)
dev:
	npm run dev

## build: Build standalone production bundle
build:
	NEXT_PUBLIC_API_URL=https://admin.nexton.work NEXT_PUBLIC_TENANT_ROOT_DOMAIN=nexton.work NEXT_TELEMETRY_DISABLED=1 npm run build

## deploy: Manual escape hatch — CD (.github/workflows/deploy.yml) is the normal path.
## Builds locally, stages a timestamped release, then blue-green swaps via the
## SAME scripts/deploy-admin-remote.sh the workflow uses, so the two can't drift.
deploy:
	@echo "=== Deploy Super Admin Console (admin.nexton.work) ==="
	@echo "Note: pushing to master deploys automatically. This is the manual fallback."
	@read -p "Deploy to production? (y/n) " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "[1/3] Building locally..."
	NEXT_PUBLIC_API_URL=https://admin.nexton.work NEXT_PUBLIC_TENANT_ROOT_DOMAIN=nexton.work NEXT_TELEMETRY_DISABLED=1 npm run build
	@echo "[2/3] Staging new release..."
	@release="$(RELEASES_DIR)/$$(date -u +%Y%m%d-%H%M%S)"; \
	prev=$$($(SSH) $(SERVER) "readlink -f '$(CURRENT_LINK)' 2>/dev/null || true"); \
	ld=""; lds=""; ldp=""; \
	if [ -n "$$prev" ]; then ld="--link-dest=$$prev"; lds="--link-dest=$$prev/.next/static"; ldp="--link-dest=$$prev/public"; fi; \
	$(SSH) $(SERVER) "mkdir -p '$$release'"; \
	rsync -az -e "ssh $(SSH_OPTS)" $$ld  .next/standalone/ $(SERVER):$$release/; \
	rsync -az -e "ssh $(SSH_OPTS)" $$lds .next/static/     $(SERVER):$$release/.next/static/; \
	rsync -az -e "ssh $(SSH_OPTS)" $$ldp public/           $(SERVER):$$release/public/; \
	$(SSH) $(SERVER) "chown -R 1000:1000 '$$release'"; \
	echo "[3/3] Blue-green swap..."; \
	$(SSH) $(SERVER) "NETWORK='$(NETWORK)' RELEASE='$$release' CONTAINER='$(CONTAINER)' \
		PORT='$(PORT)' CURRENT_LINK='$(CURRENT_LINK)' NGINX='$(NGINX)' bash -s" \
		< scripts/deploy-admin-remote.sh
	@echo ""
	@echo "=== Deployed! Verify: curl -o /dev/null -w '%{http_code}\\n' https://admin.nexton.work/ ==="

## help: Show this help message
help:
	@echo "Nexton Super Admin Console (admin.nexton.work)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | column -t -s ':'
