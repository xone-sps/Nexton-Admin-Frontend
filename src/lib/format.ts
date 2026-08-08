import type { TranslationKeys } from "@/i18n/lo";

export function slugify(text: string, separator: "-" | "_" = "-"): string {
  const duplicateSeparator = separator === "-" ? /-+/g : /_+/g;

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, separator)
    .replace(duplicateSeparator, separator);
}

export function formatPrice(
  amount: number,
  locale = "en-US",
  currency = "LAK"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function fieldRequired(
  t: TranslationKeys,
  fieldLabel: string
): string {
  return t.common.fieldRequired.replace("{field}", fieldLabel);
}
