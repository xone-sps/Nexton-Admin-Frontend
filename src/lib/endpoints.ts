export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

export const ADMIN_ENDPOINTS = {
  TENANTS: "/admin/tenants",
  TENANT: (id: string) => `/admin/tenants/${id}`,
  TENANT_ROLES: (id: string) => `/admin/tenants/${id}/roles`,
  PACKAGES: "/admin/packages",
  PACKAGE: (id: string) => `/admin/packages/${id}`,
  MODULES: "/admin/modules",
} as const;
