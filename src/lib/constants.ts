export const ADMIN_ACCESS_TOKEN_KEY = "nexton_admin_access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "nexton_admin_refresh_token";
export const DEFAULT_TABLE_PAGE_SIZE = 10;
export const DRAWER_WIDTH = 480;
// Platform roles that may access the admin console (any of these passes the
// login gate). Nav/actions are further gated per-role in the UI.
export const ADMIN_ROLES = ["superadmin", "admin", "support", "billing"] as const;

// Platform roles allowed to manage platform staff (Platform Users page).
export const PLATFORM_USER_ADMIN_ROLES = ["superadmin"] as const;
