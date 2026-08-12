"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  DollarOutlined,
  StopOutlined,
  SyncOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { BILLING_ENDPOINTS } from "@/lib/endpoints";
import { formatPrice } from "@/lib/format";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/lib/constants";
import type {
  ApiResponse,
  BillingStats,
  Invoice,
  InvoiceStatus,
  PaymentMethod,
} from "@/lib/types";
import { InvoiceStatusTag } from "@/components/billing/InvoiceStatusTag";

const { Title, Text } = Typography;

type MarkPaidValues = { method: PaymentMethod; reference?: string };

export default function BillingPage() {
  const { t } = useI18n();
  const { message, modal } = App.useApp();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [month, setMonth] = useState<Dayjs | null>(null);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [running, setRunning] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string>("");

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);
  const [form] = Form.useForm<MarkPaidValues>();

  // A selected month maps to a [from, to] period_start range (YYYY-MM-DD).
  const monthRange = useCallback(() => {
    if (!month) return {};
    return {
      from: month.startOf("month").format("YYYY-MM-DD"),
      to: month.endOf("month").format("YYYY-MM-DD"),
    };
  }, [month]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Invoice[]>>(
        BILLING_ENDPOINTS.INVOICES,
        {
          params: {
            page,
            per_page: perPage,
            status: status || undefined,
            ...monthRange(),
          },
        }
      );
      setInvoices(data.data || []);
      setTotal(data.meta?.total ?? 0);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, status, monthRange, message, t.common.loadFailed]);

  // Stats reflect the month filter (but not status, so the breakdown is complete).
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<BillingStats>>(
        BILLING_ENDPOINTS.STATS,
        { params: { ...monthRange() } }
      );
      setStats(data.data);
    } catch {
      /* stats are non-critical; ignore */
    }
  }, [monthRange]);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [fetchInvoices, fetchStats]);

  const refresh = () => {
    fetchInvoices();
    fetchStats();
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setPdfLoadingId(invoice.id);
    try {
      const res = await api.get(BILLING_ENDPOINTS.PDF(invoice.id), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setPdfLoadingId("");
    }
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

  const handleRunRenewals = async () => {
    setRunning(true);
    try {
      const { data } = await api.post<
        ApiResponse<{
          renewed: number;
          invoiced: number;
          past_due: number;
          suspended: number;
        }>
      >(BILLING_ENDPOINTS.RUN_RENEWALS, {});
      const r = data.data;
      message.success(
        `${t.billing.runRenewalsDone} — +${r.invoiced} / ${r.past_due} / ${r.suspended}`
      );
      refresh();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setRunning(false);
    }
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: t.billing.invoiceNumber,
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (num: string) => (
        <Text style={{ fontFamily: "monospace" }}>{num}</Text>
      ),
    },
    {
      title: t.billing.company,
      dataIndex: "tenant_name",
      key: "tenant_name",
      render: (name: string, record) => (
        <Link href={`/companies/${record.tenant_id}`}>{name}</Link>
      ),
    },
    {
      title: t.billing.period,
      key: "period",
      render: (_, record) =>
        `${formatDate(record.period_start)} → ${formatDate(record.period_end)}`,
    },
    {
      title: t.billing.amount,
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number, record) =>
        formatPrice(amount, "en-US", record.currency),
    },
    {
      title: t.billing.dueDate,
      dataIndex: "due_date",
      key: "due_date",
      render: (due: string) => formatDate(due),
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
      width: 230,
      render: (_, record) => {
        const payable = record.status === "open" || record.status === "past_due";
        return (
          <Space>
            <Tooltip title={t.billing.markPaid}>
              <Button
                type="link"
                size="small"
                icon={<DollarOutlined />}
                disabled={!payable}
                onClick={() => openMarkPaid(record)}
              >
                {t.billing.markPaid}
              </Button>
            </Tooltip>
            <Tooltip title={t.billing.exportPdf}>
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined />}
                loading={pdfLoadingId === record.id}
                onClick={() => handleDownloadPdf(record)}
              />
            </Tooltip>
            <Tooltip title={t.billing.voidInvoice}>
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                disabled={!payable}
                onClick={() => handleVoid(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const money = (v?: number) =>
    formatPrice(v ?? 0, "en-US", stats?.currency || "LAK");

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {t.billing.title}
        </Title>
        <Space>
          <Tooltip title={t.common.refresh}>
            <Button
              icon={<ReloadOutlined />}
              aria-label={t.common.refresh}
              onClick={refresh}
            >
              {t.common.refresh}
            </Button>
          </Tooltip>
          <Tooltip title={t.billing.runRenewals}>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              loading={running}
              onClick={handleRunRenewals}
            >
              {t.billing.runRenewals}
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card size="small">
          <Statistic
            title={t.billing.totalInvoices}
            value={stats?.total_count ?? 0}
            prefix={<FileTextOutlined style={{ color: "#6366F1" }} />}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={t.billing.totalBilled}
            value={money(stats?.total_amount)}
            prefix={<WalletOutlined />}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={t.billing.paidAmount}
            value={money(stats?.paid_amount)}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            styles={{ content: { color: "#52c41a" } }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title={t.billing.outstanding}
            value={money(stats?.outstanding_amount)}
            prefix={<ExclamationCircleOutlined style={{ color: "#faad14" }} />}
            styles={{ content: { color: "#faad14" } }}
          />
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Select
            style={{ width: 200 }}
            value={status || undefined}
            placeholder={t.billing.filterStatus}
            allowClear
            onChange={(v) => {
              setStatus((v as InvoiceStatus) || "");
              setPage(1);
            }}
            options={[
              { value: "open", label: t.billing.statuses.open },
              { value: "paid", label: t.billing.statuses.paid },
              { value: "past_due", label: t.billing.statuses.past_due },
              { value: "void", label: t.billing.statuses.void },
            ]}
          />
          <DatePicker
            picker="month"
            value={month}
            onChange={(v) => {
              setMonth(v);
              setPage(1);
            }}
            placeholder={t.billing.filterMonth}
            style={{ width: 200 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: perPage,
            total,
            showSizeChanger: true,
            showTotal: (n) => `${t.common.total}: ${n}`,
            onChange: (p, ps) => {
              setPage(p);
              setPerPage(ps);
            },
          }}
        />
      </Card>

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
          <Form.Item
            name="method"
            label={t.billing.paymentMethod}
            initialValue="manual"
          >
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

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
