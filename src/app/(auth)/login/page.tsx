"use client";

import { useState } from "react";
import { Alert, App, Button, Card, Form, Input, Typography, Space } from "antd";
import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import LanguageSwitch from "@/components/LanguageSwitch";
import { fieldRequired } from "@/lib/format";
import { useFormSubmittable } from "@/lib/useFormSubmittable";

const { Title, Text } = Typography;

type LoginFormValues = { email: string; password: string };

export default function LoginPage() {
  const { login } = useAuth({ autoFetch: false });
  const { t } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<LoginFormValues>();
  const ok = useFormSubmittable(form);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "ACCESS_DENIED"
          ? t.auth.accessDenied
          : t.auth.loginError;
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
        padding: 24,
      }}
    >
      <div style={{ position: "absolute", top: 24, right: 24 }}>
        <LanguageSwitch />
      </div>

      <Card
        style={{
          width: 420,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "none",
          borderRadius: 16,
        }}
        styles={{ body: { padding: "40px 36px" } }}
      >
        <Space orientation="vertical" size={8} style={{ width: "100%", textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.svg" alt={t.common.appName} width={180} height={44} style={{ width: "auto", height: "auto", objectFit: "contain" }} preload />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <SafetyCertificateOutlined style={{ color: "#6366F1", fontSize: 18 }} />
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              {t.auth.loginTitle}
            </Title>
          </div>
          <Text type="secondary">{t.auth.loginSubtitle}</Text>
        </Space>

        {errorMsg && (
          <Alert
            type="error"
            title={errorMsg}
            showIcon
            closable={{ onClose: () => setErrorMsg(null) }}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
          <Form.Item
            name="email"
            label={t.auth.email}
            rules={[
              { required: true, message: fieldRequired(t, t.auth.email) },
              { type: "email", message: t.validation.email },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: "#9CA3AF" }} />} placeholder="admin@nexton.la" />
          </Form.Item>

          <Form.Item
            name="password"
            label={t.auth.password}
            rules={[{ required: true, message: fieldRequired(t, t.auth.password) }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: "#9CA3AF" }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!ok}
              block
              style={{ height: 44, fontWeight: 600, background: "#6366F1" }}
            >
              {t.auth.loginButton}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
