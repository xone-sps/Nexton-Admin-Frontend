export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

export const ADMIN_ENDPOINTS = {
  STATS: "/admin/stats",
  NOTIFICATIONS: "/admin/notifications",
  BANK_ACCOUNTS: "/admin/bank-accounts",
  BANK_ACCOUNT: (id: string) => `/admin/bank-accounts/${id}`,
  BANK_ACCOUNT_DEFAULT: (id: string) => `/admin/bank-accounts/${id}/set-default`,
  TENANTS: "/admin/tenants",
  TENANT: (id: string) => `/admin/tenants/${id}`,
  TENANT_ROLES: (id: string) => `/admin/tenants/${id}/roles`,
  TENANT_INVOICES: (id: string) => `/admin/tenants/${id}/invoices`,
  TENANT_LOGO: (id: string) => `/admin/tenants/${id}/logo`,
  PACKAGES: "/admin/packages",
  PACKAGE: (id: string) => `/admin/packages/${id}`,
  MODULES: "/admin/modules",
} as const;

export const PLATFORM_USER_ENDPOINTS = {
  LIST: "/admin/platform-users",
  ONE: (id: string) => `/admin/platform-users/${id}`,
} as const;

export const BILLING_ENDPOINTS = {
  STATS: "/admin/billing/stats",
  INVOICES: "/admin/billing/invoices",
  INVOICE: (id: string) => `/admin/billing/invoices/${id}`,
  PDF: (id: string) => `/admin/billing/invoices/${id}/pdf`,
  MARK_PAID: (id: string) => `/admin/billing/invoices/${id}/mark-paid`,
  VOID: (id: string) => `/admin/billing/invoices/${id}/void`,
  GENERATE_INVOICE: (subscriptionId: string) =>
    `/admin/billing/subscriptions/${subscriptionId}/generate-invoice`,
  RENEW: (subscriptionId: string) =>
    `/admin/billing/subscriptions/${subscriptionId}/renew`,
  RUN_RENEWALS: "/admin/billing/run-renewals",
} as const;
