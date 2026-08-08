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
  modules?: string[];
  user_count?: number;
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
