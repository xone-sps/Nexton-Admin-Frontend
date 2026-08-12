"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography, Spin, Tag, theme } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  StopOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useI18n } from "@/i18n/context";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import { formatPrice } from "@/lib/format";
import type { ApiResponse, DashboardStats, Tenant } from "@/lib/types";
import { BarChart } from "@/components/charts/BarChart";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get<ApiResponse<DashboardStats>>(ADMIN_ENDPOINTS.STATS, {
            params: { months: 6 },
          }),
          api.get<ApiResponse<Tenant[]>>(ADMIN_ENDPOINTS.TENANTS, {
            params: { per_page: 5 },
          }),
        ]);
        setStats(statsRes.data.data);
        setRecent(recentRes.data.data || []);
      } catch {
        // Silently handle — empty state shown
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currency = stats.mrr.currency || "LAK";
  const money = (v: number) => formatPrice(v, "en-US", currency);
  // Compact money for chart value labels (e.g. 15.0M).
  const moneyShort = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
    return String(v);
  };
  const planLabel = (plan: string) =>
    (t.plans as Record<string, string>)[plan] ||
    plan.charAt(0).toUpperCase() + plan.slice(1);

  const inv = stats.invoices;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t.dashboard.welcome}, {user?.email}
        </Title>
        <Text type="secondary">{t.auth.loginSubtitle}</Text>
      </div>

      {/* Company / user overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.totalCompanies}
              value={stats.companies.total}
              prefix={<BankOutlined style={{ color: token.colorPrimary }} />}
              styles={{ content: { color: token.colorPrimary, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.activeCompanies}
              value={stats.companies.active}
              prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
              styles={{ content: { color: token.colorSuccess, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.suspendedCompanies}
              value={stats.companies.suspended}
              prefix={<StopOutlined style={{ color: token.colorError }} />}
              styles={{ content: { color: token.colorError, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.totalUsers}
              value={stats.users_total}
              prefix={<TeamOutlined style={{ color: token.colorWarning }} />}
              styles={{ content: { color: token.colorWarning, fontWeight: 700 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Invoice summary */}
      <Title level={5} style={{ marginBottom: 12 }}>
        {t.dashboard.invoiceSummary}
      </Title>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t.billing.totalInvoices}
              value={inv.total_count}
              prefix={<FileTextOutlined style={{ color: token.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t.billing.totalBilled}
              value={money(inv.total_amount)}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t.billing.paidAmount}
              value={money(inv.paid_amount)}
              prefix={<DollarOutlined style={{ color: token.colorSuccess }} />}
              styles={{ content: { color: token.colorSuccess } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title={t.billing.outstanding}
              value={money(inv.outstanding_amount)}
              prefix={<ExclamationCircleOutlined style={{ color: token.colorWarning }} />}
              styles={{ content: { color: token.colorWarning } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t.dashboard.monthlyIncome}>
            <BarChart
              data={stats.monthly_income.map((m) => ({
                label: m.label,
                value: m.amount,
              }))}
              color={token.colorPrimary}
              formatValue={moneyShort}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={t.dashboard.companyValue}
            extra={
              <Text strong style={{ color: token.colorSuccess }}>
                <RiseOutlined /> {t.dashboard.mrr}: {money(stats.mrr.total)}
              </Text>
            }
          >
            <BarChart
              data={stats.mrr.by_plan.map((p) => ({
                label: planLabel(p.plan),
                value: p.amount,
                sublabel: `${p.companies} ${t.dashboard.companies}`,
              }))}
              color={token.colorSuccess}
              formatValue={moneyShort}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent activity */}
      <Card title={t.dashboard.recentActivity}>
        {recent.length > 0 ? (
          <div>
            {recent.map((tenant, idx) => (
              <div
                key={tenant.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 0",
                  borderTop: idx === 0 ? "none" : `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: token.colorFillTertiary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {tenant.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenant.logo_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <BankOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{tenant.name}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {new Date(tenant.created_at).toLocaleDateString()}
                    {" · "}
                    <Tag color="blue" style={{ marginLeft: 4 }}>
                      {planLabel(tenant.plan)}
                    </Tag>
                  </Text>
                </div>
                <Tag color={tenant.status === "active" ? "green" : "red"}>
                  {tenant.status === "active" ? t.common.active : t.companies.suspended}
                </Tag>
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary">{t.common.noData}</Text>
        )}
      </Card>
    </div>
  );
}
