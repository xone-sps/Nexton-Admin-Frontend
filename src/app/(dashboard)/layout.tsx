"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Spin, Tag } from "antd";
import {
  DashboardOutlined,
  BankOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import ErrorBoundary from "@/components/ErrorBoundary";
import Logo from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  // Determine selected key from pathname
  const getSelectedKey = () => {
    if (pathname === "/") return "/";
    if (pathname.startsWith("/companies")) return "/companies";
    if (pathname.startsWith("/packages")) return "/packages";
    if (pathname.startsWith("/settings")) return "/settings";
    return pathname;
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: t.nav.dashboard,
    },
    {
      key: "/companies",
      icon: <BankOutlined />,
      label: t.nav.companies,
    },
    {
      key: "/packages",
      icon: <AppstoreOutlined />,
      label: t.nav.packages,
    },
    { type: "divider" },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: t.nav.settings,
    },
  ];

  const userMenuItems: MenuProps["items"] = [
    { key: "profile", label: t.settings.profile, icon: <SettingOutlined /> },
    { type: "divider" },
    { key: "logout", label: t.auth.logout, icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Logo collapsed={collapsed} />
        {!collapsed && (
          <div style={{ textAlign: "center", marginTop: -12, marginBottom: 16 }}>
            <Tag color="#6366F1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
              ADMIN
            </Tag>
          </div>
        )}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: "none" }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E2E6EF",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: "pointer", fontSize: 18, color: "#6B7280" }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Space size={16}>
            <LanguageSwitch />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === "logout") logout();
                  else if (key === "profile") router.push("/settings");
                },
              }}
              trigger={["click"]}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                <Avatar style={{ backgroundColor: "#6366F1" }} size={36}>
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
                {!collapsed && (
                  <Text style={{ maxWidth: 140, display: "inline-block" }} ellipsis>
                    {user.email}
                  </Text>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 24 }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
