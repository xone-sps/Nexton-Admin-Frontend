import { Tag } from "antd";
import type { TranslationKeys } from "@/i18n/context";
import type { InvoiceStatus } from "@/lib/types";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  open: "gold",
  paid: "green",
  past_due: "red",
  void: "default",
};

export function InvoiceStatusTag({
  status,
  t,
}: {
  status: InvoiceStatus;
  t: TranslationKeys;
}) {
  return (
    <Tag color={STATUS_COLORS[status] ?? "default"}>
      {t.billing.statuses[status] ?? status}
    </Tag>
  );
}
