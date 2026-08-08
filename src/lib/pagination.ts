import type { TranslationKeys } from "@/i18n/context";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/constants";

export function defaultPagination(t: TranslationKeys) {
  return {
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
    showSizeChanger: true,
    showTotal: (total: number) => `${t.common.total}: ${total}`,
  };
}
