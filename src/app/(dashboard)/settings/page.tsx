"use client";

import { useState } from "react";
import {
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  GlobalOutlined,
  KeyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, type Locale } from "@/i18n/context";
import api from "@/lib/api";
import { applyApiErrorToForm, getApiErrorMessage } from "@/lib/apiError";
import { AUTH_ENDPOINTS } from "@/lib/endpoints";
import { useFormSubmittable } from "@/lib/useFormSubmittable";

const { Title } = Typography;

type ChangePasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

function isStrongPassword(value: string): boolean {
  return value.length >= 8;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { message } = App.useApp();
  const [form] = Form.useForm<ChangePasswordForm>();
  const ok = useFormSubmittable(form);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const onChangePassword = async (values: ChangePasswordForm) => {
    setSubmitting(true);
    try {
      await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success(t.settings.passwordChanged);
      form.resetFields();
      // Force re-login so the user authenticates with the new password.
      setTimeout(() => logout(), 1500);
    } catch (err) {
      if (!applyApiErrorToForm(err, form)) {
        message.error(getApiErrorMessage(err, t.settings.passwordChangeError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "—";

  const languages: { key: Locale; label: string }[] = [
    { key: "lo", label: "ລາວ" },
    { key: "en", label: "English" },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        {t.nav.settings}
      </Title>

      <Card
        title={
          <Space>
            <UserOutlined />
            {t.settings.profile}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions
          column={1}
          bordered
          size="middle"
          items={[
            {
              key: "email",
              label: t.settings.email,
              children: user.email,
            },
            {
              key: "name",
              label: t.settings.fullName,
              children: fullName,
            },
            {
              key: "role",
              label: t.settings.role,
              children: (
                <Space size={4} wrap>
                  {(user.roles ?? []).map((r) => (
                    <Tag key={r} color="blue">
                      {r}
                    </Tag>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title={
          <Space>
            <KeyOutlined />
            {t.settings.changePassword}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onChangePassword}
          style={{ maxWidth: 480 }}
        >
          <Form.Item
            name="current_password"
            label={t.settings.currentPassword}
            rules={[{ required: true, message: t.validation.required }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label={t.settings.newPassword}
            rules={[
              { required: true, message: t.validation.required },
              {
                validator(_, value) {
                  if (!value || isStrongPassword(value)) return Promise.resolve();
                  return Promise.reject(new Error(t.validation.passwordMin));
                },
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label={t.settings.confirmPassword}
            dependencies={["new_password"]}
            rules={[
              { required: true, message: t.validation.required },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t.settings.passwordMismatch));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} disabled={!ok}>
            {t.settings.changePassword}
          </Button>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <GlobalOutlined />
            {t.settings.language}
          </Space>
        }
      >
        <Space>
          {languages.map((lang) => (
            <Button
              key={lang.key}
              type={locale === lang.key ? "primary" : "default"}
              onClick={() => setLocale(lang.key)}
            >
              {lang.label}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}
