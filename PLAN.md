# Nexton Admin-Frontend — Implementation Plan

> Standalone super-admin console for the Nexton multi-tenant HRM SaaS.
> Manages tenants (companies), subscription packages/modules, platform users & RBAC,
> billing, platform settings, and audit — talking to the Go control-plane API.
>
> **Status:** Planning. This repo (`Nexton-Admin-Frontend/`) is currently empty; the
> plan is to extract and evolve the existing embedded panel at `Nexton-Backend/admin/`.

---

## 0. Context & decisions

**Decisions taken (defaults, revisit anytime):**
- **Approach:** Extract & evolve — lift `Nexton-Backend/admin/` into this repo, then
  incrementally re-architect for scale. Fastest path to parity, lowest risk.
- **Scope:** Frontend **plus** the backend endpoint gaps it depends on. Most new admin
  features are blocked without new control-plane APIs.
- **Stack:** Keep Next.js 16 + AntD v6 + TypeScript (proven, already deployed). Add
  **TanStack Query** for server-state (the core scale change). Keep i18n bespoke for now.
- **First step:** This document. Then Phase 0 extraction.

**Sibling projects (all under `/Users/xone/software/Nexton/`):**
- `Nexton-Backend/` — Go/Echo API; control-plane + database-per-tenant. Currently also
  hosts the embedded admin at `admin/` (to be extracted here).
- `Nexton-Company-Frontend/` — tenant-facing HR app served at `*.nexton.work`.
- `Nexton-Admin-Frontend/` — **this repo** (target).

---

## 1. What we're extracting (current embedded admin)

Location: `Nexton-Backend/admin/` — Next 16 App Router, `output: "standalone"`, port 3001,
React 19.2, AntD v6, Axios, js-cookie, hand-rolled i18n (lo/en), Tailwind v4 (barely used).

**Pages:** `(auth)/login` · `(dashboard)/` (dashboard) · `companies` · `companies/[id]`
(Overview / Users / Subscription tabs) · `packages` · `settings`.

**Auth:** login on `admin.nexton.work` → backend mints a `nexton.admin`-audience JWT
(separate signing secret from tenant/portal). Tokens in **non-httpOnly** cookies +
in-memory; axios interceptor does 401 → refresh → retry. Route protection is
**client-side only** (no Next middleware).

**Keep these primitives:** axios token/refresh module, `useFormSubmittable`,
`applyApiErrorToForm` / `getApiErrorMessage`, `SlugBadge`, `SearchInput`, `slugify`,
`formatPrice`, `defaultPagination`, the AntD theme (indigo `#6366F1`), i18n en/lo.

**Deploy today:** `make deploy-admin` builds locally, rsyncs `.next/standalone` to the
droplet, runs the `nexton-admin` container; nginx proxies `admin.nexton.work` → :3001 and
`/api/` → the Go API. `deploy/docker/admin.Dockerfile` builds it.

---

## 2. Backend API surface (control-plane, `nexton.admin` audience)

Consumed via `NEXT_PUBLIC_API_URL` + `/api/v1`.

**Auth (host-driven audience):**
- `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `PUT /auth/change-password`

**Tenants** (`/admin/tenants`, guarded by admin JWT + `RequireRole(superadmin,admin)`):
- `POST /admin/tenants` (full provisioning: DB create + migrate + admin user + subscription + RBAC seed)
- `GET /admin/tenants` (query: `page`, `per_page`/`limit`, `status`, `search`)
- `GET/PUT /admin/tenants/:id`
- `POST /admin/tenants/:id/suspend` · `POST /admin/tenants/:id/activate`
- `GET/POST /admin/tenants/:id/users` · `PUT /admin/tenants/:id/users/:userId`
- `GET /admin/tenants/:id/roles`

**Packages** (`/admin/packages`):
- `GET/POST /admin/packages` · `GET /admin/packages/:key` · `PUT /admin/packages/:id`
  (⚠️ id/key asymmetry; **no DELETE**)

**Modules:** `GET /admin/modules` (read-only catalog)

**System (tenant-scoped, permission-gated)** — usable when acting inside a tenant:
- `/system/users`, `/system/roles`, `/system/permissions`, `/system/permission-groups`
- `/system/online/list` + `POST /system/online/kick` (live sessions + force logout)

**Control DB tables:** `tenants`, `users`, `tenant_databases`, `subscriptions`,
`subscription_modules`, `modules`, `packages`, `package_modules`, RBAC (`roles`,
`permissions`, `user_roles`, `role_permissions`, `permission_groups`), Lao address catalog.

---

## 3. Backend gaps (blockers for a large-scale admin)

These do **not** exist yet and must be built (Go side) for the corresponding admin features:

| # | Gap | Blocks |
|---|-----|--------|
| 1 | **Client-side-only pagination** everywhere (admin fetches full lists) | Scale — must move to server pagination/search/filter (backend `meta` already supports it) |
| 2 | **No `/admin/stats` / dashboard aggregate endpoint** | Real dashboard KPIs (tenant counts, MRR, active users) |
| 3 | **No billing/invoicing/payments** (no invoices/payments/dunning; `base_price` never charged) | Billing UI, revenue, subscription renewal (see CarePlus renewal-gap note) |
| 4 | **No global platform-staff model** (admins are tenant-bound `users`; role-string gate only) | Cross-tenant platform users, granular platform RBAC, admin invites |
| 5 | **No platform-settings API** | Settings page has no backing store |
| 6 | **No audit-log read API** | Audit viewer |
| 7 | **No tenant hard-delete / offboarding endpoint** | Tenant lifecycle management |
| 8 | **No package DELETE; modules catalog read-only over HTTP** | Package/module management |
| 9 | **No subscription lifecycle endpoints** (renew/cancel/change-package, trial expiry, `expires_at` enforcement) | Subscription management |
| 10 | **CORS wide open** (`server.go` AllowOriginFunc returns true) | Must lock to admin origin before separate-origin frontend ships |

---

## 4. Target architecture

- **Standalone repo** with its own CI/CD, Dockerfile, nginx block (reuse existing).
- **TanStack Query** as the server-state layer — pagination, caching, invalidation for
  every list. Core scale change.
- **Typed API client** — single layer over `ApiResponse<T>` envelope; centralize all
  endpoints (including the ad-hoc `/tenants/:id/users` paths currently string-built).
- **Feature-based structure:**
  ```
  src/
    app/                      # Next routes (thin — delegate to features)
    features/
      auth/  tenants/  packages/  modules/  platform-users/
      billing/  rbac/  settings/  audit/  analytics/
        {api.ts, hooks.ts, components/, types.ts}
    lib/        # api client, query client, cookies, format, errors
    components/ # design-system primitives (Table, Drawer, Form, StatCard...)
    i18n/  theme/  hooks/
  ```
- **RBAC-driven nav & route guards** derived from `/auth/me` — ready for a granular
  platform-permission catalog when the backend gains one.
- **Next.js middleware** route guards; move toward httpOnly cookie handling.
- **Design-system layer** — shared list/detail/form patterns so 20+ future screens stay
  consistent.

---

## 5. Phased roadmap

### Phase 0 — Extraction & standalone setup (parity, nothing new)
- Copy `Nexton-Backend/admin/` → this repo; `git init`; own `package.json`, CI, Dockerfile.
- Env config (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TENANT_ROOT_DOMAIN`).
- **Backend:** lock CORS to `https://admin.nexton.work` (+ localhost in dev).
- Update `Nexton-Backend/Makefile deploy-admin` + `admin.Dockerfile` to build from this repo
  (or add a `deploy` here); keep nginx block as-is.
- Verify full parity against production API. **Ship.**

### Phase 1 — Scale foundation
- Introduce TanStack Query + QueryClientProvider.
- Convert **all lists** to server-side pagination/search/filter/sort (tenants, packages).
- Typed API client + centralized endpoints; kill string-built paths.
- Next.js middleware route guards; design-system primitives (DataTable, FormDrawer, StatCard).
- **Backend:** `GET /admin/stats` → wire real dashboard KPIs.

### Phase 2 — Admin capability expansion (paired backend work)
- Platform-staff management + granular platform RBAC (backend: platform-user model/endpoints).
- Tenant offboarding/delete (backend endpoint).
- Package delete + module CRUD (backend endpoints).
- Platform-settings page + API (backend: settings store).
- Audit-log viewer (backend: audit read API).
- Live-session management UI (backend already supports `/system/online/*`).

### Phase 3 — Billing & subscriptions (largest gap)
- **Backend:** invoices/payments/subscription-lifecycle tables + endpoints; renewal/proration.
- Frontend: billing screens, invoices, subscription lifecycle, MRR/revenue analytics.

### Phase 4 — Hardening
- i18n decision (bespoke vs next-intl), tests (unit + e2e), observability, performance,
  accessibility, httpOnly cookie migration.

---

## 6. Open questions for the user
1. Confirm approach = **Extract & evolve** (vs greenfield / heavy-refactor).
2. Confirm scope includes **backend gap endpoints** (vs frontend-only against current API).
3. Confirm **keep AntD v6 + add TanStack Query** (vs keep-as-is / modernize to shadcn+Tailwind).
4. Should Phase 0 be **scaffolded now**, or plan-only first?
5. Is the **billing engine** (Phase 3) in scope for this effort or a separate workstream?
