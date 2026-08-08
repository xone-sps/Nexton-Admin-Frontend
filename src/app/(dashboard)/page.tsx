"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography, Spin, Tag, theme } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  StopOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useI18n } from "@/i18n/context";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";

const { Title, Text } = Typography;

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  user_count?: number;
  created_at: string;
};

export default function DashboardPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(ADMIN_ENDPOINTS.TENANTS);
        setTenants(data.data || []);
      } catch {
        // Silently handle — empty state shown
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCompanies = tenants.length;
  const activeCompanies = tenants.filter((t) => t.status === "active").length;
  const suspendedCompanies = tenants.filter((t) => t.status === "suspended").length;
  const totalUsers = tenants.reduce((sum, t) => sum + (t.user_count || 0), 0);

  // Get 5 most recently created tenants for "Recent Activity"
  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {t.dashboard.welcome}, {user?.email}
        </Title>
        <Text type="secondary">{t.auth.loginSubtitle}</Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.totalCompanies}
              value={totalCompanies}
              prefix={<BankOutlined style={{ color: token.colorPrimary }} />}
              styles={{ content: { color: token.colorPrimary, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.activeCompanies}
              value={activeCompanies}
              prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
              styles={{ content: { color: token.colorSuccess, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.suspendedCompanies}
              value={suspendedCompanies}
              prefix={<StopOutlined style={{ color: token.colorError }} />}
              styles={{ content: { color: token.colorError, fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t.dashboard.totalUsers}
              value={totalUsers}
              prefix={<TeamOutlined style={{ color: token.colorWarning }} />}
              styles={{ content: { color: token.colorWarning, fontWeight: 700 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t.dashboard.recentActivity}>
        {recentTenants.length > 0 ? (
          <div>
            {recentTenants.map((tenant, idx) => (
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
                  }}
                >
                  <BankOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{tenant.name}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {new Date(tenant.created_at).toLocaleDateString()}
                    {" \u00B7 "}
                    <Tag color="blue" style={{ marginLeft: 4 }}>
                      {tenant.plan}
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
