export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: ApiError | null;
  meta?: PaginationMeta;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  db_name?: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  about?: string;
  modules?: string[];
  user_count?: number;
  subscription?: Subscription;
  created_at: string;
  updated_at?: string;
};

export type PackageModule = {
  module_id: string;
  module_name: string;
  is_included: boolean;
};

export type Package = {
  id: string;
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  base_price: number;
  currency: string;
  modules: PackageModule[];
};

export type Module = {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_base: boolean;
  is_active: boolean;
  sort_order: number;
};

export type TenantUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type TenantRole = {
  id: string;
  name: string;
  value: string;
  is_system: boolean;
};

export type PackageOption = {
  value: string;
  label: string;
  description?: string;
  modules_count?: number;
  modules?: string[];
  base_price?: number;
};

// --- Platform users (admin console staff) ---

export type PlatformRole = "superadmin" | "admin" | "support" | "billing";

export type PlatformUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: PlatformRole;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
};

// --- Billing ---

export type InvoiceStatus = "open" | "paid" | "past_due" | "void";

export type PaymentMethod = "manual" | "bank_transfer" | "cash" | "other";

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  paid_at: string;
  created_at: string;
};

export type Invoice = {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  subscription_id: string;
  package_id?: string;
  invoice_number: string;
  plan: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  payments?: Payment[];
};

export type BillingStats = {
  currency: string;
  total_count: number;
  total_amount: number;
  paid_count: number;
  paid_amount: number;
  open_count: number;
  open_amount: number;
  past_due_count: number;
  past_due_amount: number;
  void_count: number;
  outstanding_amount: number;
};

export type AdminNotification = {
  type: "past_due_invoice" | "tenant_suspended" | "subscription_soon";
  severity: "error" | "warning";
  tenant_id: string;
  tenant_name: string;
  invoice_id?: string;
  invoice_number?: string;
  amount?: number;
  currency?: string;
  date?: string;
  message: string;
};

export type NotificationsResponse = {
  count: number;
  items: AdminNotification[];
};

export type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
};

export type DashboardStats = {
  companies: { total: number; active: number; suspended: number; trial: number };
  users_total: number;
  invoices: BillingStats;
  mrr: {
    currency: string;
    total: number;
    by_plan: { plan: string; companies: number; amount: number }[];
  };
  monthly_income: { month: string; label: string; amount: number }[];
};

export type Subscription = {
  id: string;
  plan: string;
  package_id?: string;
  package_name?: string;
  status: string;
  started_at: string;
  current_period_start?: string;
  current_period_end?: string;
  amount: number;
  currency: string;
  modules: { module_id: string; module_name: string; is_active: boolean }[];
};
