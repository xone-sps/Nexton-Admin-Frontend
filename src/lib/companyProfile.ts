// Shared option keys for the company-profile fields (labels come from i18n:
// t.companies.industries[key] and t.companies.sizes[key]).

export const INDUSTRY_KEYS = [
  "technology",
  "manufacturing",
  "retail",
  "healthcare",
  "finance",
  "education",
  "construction",
  "logistics",
  "hospitality",
  "agriculture",
  "services",
  "other",
] as const;

export const SIZE_KEYS = ["small", "medium", "large", "enterprise"] as const;

// Accepted logo image MIME types (mirrors the backend allow-list).
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
