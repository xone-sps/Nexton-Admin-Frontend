"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from "antd";
import {
  DollarOutlined,
  FileAddOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { ADMIN_ENDPOINTS, BILLING_ENDPOINTS } from "@/lib/endpoints";
import { formatPrice } from "@/lib/format";
import type {
  ApiResponse,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  Subscription,
} from "@/lib/types";
import { InvoiceStatusTag } from "@/components/billing/InvoiceStatusTag";

const { Text } = Typography;

type MarkPaidValues = { method: PaymentMethod; reference?: string };

export function TenantBillingPanel({
  tenantId,
  subscription,
  onChanged,
}: {
  tenantId: string;
  subscription?: Subscription;
  onChanged?: () => void;
}) {
  const { t } = useI18n();
  const { message, modal } = App.useApp();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);
  const [form] = Form.useForm<MarkPaidValues>();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Invoice[]>>(
        ADMIN_ENDPOINTS.TENANT_INVOICES(tenantId),
        { params: { per_page: 100 } }
      );
      setInvoices(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [tenantId, message, t.common.loadFailed]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const refresh = () => {
    fetchInvoices();
    onChanged?.();
  };

  const handleGenerate = async () => {
    if (!subscription) return;
    setBusy(true);
    try {
      const { data } = await api.post<ApiResponse<{ created: boolean }>>(
        BILLING_ENDPOINTS.GENERATE_INVOICE(subscription.id),
        {}
      );
      message.success(
        data.data?.created ? t.billing.generateSuccess : t.billing.generateExists
      );
      refresh();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = () => {
    if (!subscription) return;
    modal.confirm({
      title: t.billing.renew,
      content: t.billing.renewConfirm,
      okText: t.billing.renew,
      cancelText: t.common.cancel,
      onOk: async () => {
        setBusy(true);
        try {
          await api.post(BILLING_ENDPOINTS.RENEW(subscription.id), {});
          message.success(t.billing.renewSuccess);
          refresh();
        } catch (err) {
          message.error(getApiErrorMessage(err, t.common.error));
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const openMarkPaid = (invoice: Invoice) => {
    setPayTarget(invoice);
    form.setFieldsValue({ method: "manual", reference: "" });
    setPayOpen(true);
  };

  const submitMarkPaid = async (values: MarkPaidValues) => {
    if (!payTarget) return;
    setPaying(true);
    try {
      await api.post(BILLING_ENDPOINTS.MARK_PAID(payTarget.id), {
        method: values.method,
        reference: values.reference || "",
      });
      message.success(t.billing.markPaidSuccess);
      setPayOpen(false);
      setPayTarget(null);
      refresh();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setPaying(false);
    }
  };

  const handleVoid = (invoice: Invoice) => {
    modal.confirm({
      title: t.billing.voidInvoice,
      content: t.billing.voidConfirm,
      okText: t.billing.voidInvoice,
      okButtonProps: { danger: true },
      cancelText: t.common.cancel,
      onOk: async () => {
        try {
          await api.post(BILLING_ENDPOINTS.VOID(invoice.id), {});
          message.success(t.billing.voidSuccess);
          refresh();
        } catch (err) {
          message.error(getApiErrorMessage(err, t.common.error));
        }
      },
    });
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: t.billing.invoiceNumber,
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (num: string) => (
        <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{num}</Text>
      ),
    },
    {
      title: t.billing.period,
      key: "period",
      render: (_, r) => `${fmtDate(r.period_start)} → ${fmtDate(r.period_end)}`,
    },
    {
      title: t.billing.amount,
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number, r) => formatPrice(amount, "en-US", r.currency),
    },
    {
      title: t.billing.dueDate,
      dataIndex: "due_date",
      key: "due_date",
      render: (d: string) => fmtDate(d),
    },
    {
      title: t.common.status,
      dataIndex: "status",
      key: "status",
      render: (s: InvoiceStatus) => <InvoiceStatusTag status={s} t={t} />,
    },
    {
      title: t.common.actions,
      key: "actions",
      width: 150,
      render: (_, r) => {
        const payable = r.status === "open" || r.status === "past_due";
        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<DollarOutlined />}
              disabled={!payable}
              onClick={() => openMarkPaid(r)}
            >
              {t.billing.markPaid}
            </Button>
            <Tooltip title={t.billing.voidInvoice}>
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={!payable}
                onClick={() => handleVoid(r)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          style={{ flex: 1, minWidth: 280 }}
          items={[
            {
              key: "price",
              label: t.billing.monthlyPrice,
              children: subscription
                ? formatPrice(subscription.amount, "en-US", subscription.currency)
                : "—",
            },
            {
              key: "period",
              label: t.billing.currentPeriod,
              children: subscription?.current_period_start
                ? `${fmtDate(subscription.current_period_start)} → ${fmtDate(
                    subscription.current_period_end || ""
                  )}`
                : "—",
            },
            {
              key: "next",
              label: t.billing.nextRenewal,
              children: fmtDate(subscription?.current_period_end || ""),
            },
          ]}
        />
        <Space>
          <Button
            icon={<FileAddOutlined />}
            loading={busy}
            disabled={!subscription}
            onClick={handleGenerate}
          >
            {t.billing.generateInvoice}
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={busy}
            disabled={!subscription}
            onClick={handleRenew}
          >
            {t.billing.renew}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        size="small"
        locale={{ emptyText: t.billing.noInvoices }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />

      <Modal
        title={t.billing.markPaidTitle}
        open={payOpen}
        onCancel={() => {
          setPayOpen(false);
          setPayTarget(null);
        }}
        okText={t.billing.markPaid}
        confirmLoading={paying}
        onOk={() => form.submit()}
      >
        {payTarget && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">{payTarget.invoice_number}</Text>
            <br />
            <Text strong style={{ fontSize: 18 }}>
              {formatPrice(payTarget.amount, "en-US", payTarget.currency)}
            </Text>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={submitMarkPaid} requiredMark={false}>
          <Form.Item name="method" label={t.billing.paymentMethod} initialValue="manual">
            <Select
              options={[
                { value: "manual", label: t.billing.methods.manual },
                { value: "bank_transfer", label: t.billing.methods.bank_transfer },
                { value: "cash", label: t.billing.methods.cash },
                { value: "other", label: t.billing.methods.other },
              ]}
            />
          </Form.Item>
          <Form.Item name="reference" label={t.billing.reference}>
            <Input placeholder="TXN-..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
