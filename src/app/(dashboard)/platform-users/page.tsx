"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Result,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import SearchInput from "@/components/SearchInput";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { applyApiErrorToForm, getApiErrorMessage } from "@/lib/apiError";
import { PLATFORM_USER_ENDPOINTS } from "@/lib/endpoints";
import { fieldRequired } from "@/lib/format";
import { defaultPagination } from "@/lib/pagination";
import { useFormSubmittable } from "@/lib/useFormSubmittable";
import type { ApiResponse, PlatformUser, PlatformRole } from "@/lib/types";

const { Title, Text } = Typography;

const ROLE_COLORS: Record<PlatformRole, string> = {
  superadmin: "purple",
  admin: "blue",
  support: "default",
  billing: "gold",
};

const ROLE_ORDER: PlatformRole[] = ["superadmin", "admin", "support", "billing"];

type FormValues = {
  email: string;
  first_name: string;
  last_name: string;
  role: PlatformRole;
  password?: string;
  is_active?: boolean;
};

export default function PlatformUsersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { message, modal } = App.useApp();

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [form] = Form.useForm<FormValues>();
  const ok = useFormSubmittable(form, { initiallyEnabled: !!editing });

  const isSuperadmin = user?.roles?.includes("superadmin");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<PlatformUser[]>>(
        PLATFORM_USER_ENDPOINTS.LIST,
        { params: { per_page: 100, search: search || undefined } }
      );
      setUsers(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [search, message, t.common.loadFailed]);

  useEffect(() => {
    if (isSuperadmin) fetchUsers();
  }, [isSuperadmin, fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: "admin", is_active: true });
    setDrawerOpen(true);
  };

  const openEdit = (u: PlatformUser) => {
    setEditing(u);
    form.setFieldsValue({
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      is_active: u.is_active,
      password: "",
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
          is_active: values.is_active,
        };
        if (values.password) payload.password = values.password;
        await api.put(PLATFORM_USER_ENDPOINTS.ONE(editing.id), payload);
        message.success(t.platformUsers.updateSuccess);
      } else {
        await api.post(PLATFORM_USER_ENDPOINTS.LIST, {
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
        });
        message.success(t.platformUsers.createSuccess);
      }
      setDrawerOpen(false);
      setEditing(null);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      if (!applyApiErrorToForm(err, form)) {
        message.error(getApiErrorMessage(err, t.common.error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (u: PlatformUser) => {
    modal.confirm({
      title: t.common.delete,
      content: `${t.platformUsers.deleteConfirm} (${u.email})`,
      okText: t.common.delete,
      okButtonProps: { danger: true },
      cancelText: t.common.cancel,
      onOk: async () => {
        try {
          await api.delete(PLATFORM_USER_ENDPOINTS.ONE(u.id));
          message.success(t.platformUsers.deleteSuccess);
          fetchUsers();
        } catch (err) {
          message.error(getApiErrorMessage(err, t.common.error));
        }
      },
    });
  };

  if (user && !isSuperadmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle={t.platformUsers.onlySuperadmin}
      />
    );
  }

  const roleOptions = ROLE_ORDER.map((r) => ({
    value: r,
    label: (
      <Space>
        <Tag color={ROLE_COLORS[r]} style={{ margin: 0 }}>
          {t.platformUsers.roles[r]}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t.platformUsers.roleHints[r]}
        </Text>
      </Space>
    ),
  }));

  const columns: ColumnsType<PlatformUser> = [
    {
      title: t.platformUsers.firstName,
      key: "name",
      render: (_, r) => (
        <span style={{ fontWeight: 500 }}>
          {`${r.first_name} ${r.last_name}`.trim() || "—"}
        </span>
      ),
    },
    { title: t.platformUsers.email, dataIndex: "email", key: "email" },
    {
      title: t.platformUsers.role,
      dataIndex: "role",
      key: "role",
      render: (role: PlatformRole) => (
        <Tag color={ROLE_COLORS[role]}>{t.platformUsers.roles[role]}</Tag>
      ),
    },
    {
      title: t.common.status,
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? t.common.active : t.common.inactive}
        </Tag>
      ),
    },
    {
      title: t.platformUsers.lastLogin,
      dataIndex: "last_login_at",
      key: "last_login_at",
      render: (v?: string) =>
        v ? (
          new Date(v).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        ) : (
          <Text type="secondary">{t.platformUsers.neverLoggedIn}</Text>
        ),
    },
    {
      title: t.common.actions,
      key: "actions",
      width: 140,
      render: (_, r) => {
        const isSelf = r.id === user?.user_id;
        return (
          <Space>
            <Tooltip title={t.common.edit}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
            <Tooltip title={isSelf ? "" : t.common.delete}>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isSelf}
                onClick={() => handleDelete(r)}
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
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {t.platformUsers.title}
        </Title>
        <Space>
          <Tooltip title={t.common.refresh}>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              {t.common.refresh}
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t.platformUsers.newUser}
          </Button>
        </Space>
      </div>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        {t.platformUsers.subtitle}
      </Text>

      <Card>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <SearchInput
            placeholder={t.common.search + "..."}
            value={search}
            onChange={setSearch}
          />
        </div>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={defaultPagination(t)}
        />
      </Card>

      <Drawer
        title={editing ? t.platformUsers.editUser : t.platformUsers.newUser}
        size={480}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                setEditing(null);
                form.resetFields();
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!ok}
              onClick={() => form.submit()}
            >
              {editing ? t.common.save : t.common.create}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="email"
            label={t.platformUsers.email}
            rules={[
              { required: true, message: fieldRequired(t, t.platformUsers.email) },
              { type: "email", message: t.validation.email },
            ]}
          >
            <Input placeholder="staff@nexton.la" disabled={!!editing} />
          </Form.Item>

          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="first_name"
              label={t.platformUsers.firstName}
              rules={[{ required: true, message: fieldRequired(t, t.platformUsers.firstName) }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="last_name"
              label={t.platformUsers.lastName}
              rules={[{ required: true, message: fieldRequired(t, t.platformUsers.lastName) }]}
              style={{ flex: 1 }}
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="role"
            label={t.platformUsers.role}
            rules={[{ required: true, message: fieldRequired(t, t.platformUsers.role) }]}
          >
            <Select options={roleOptions} optionLabelProp="label" />
          </Form.Item>

          <Form.Item
            name="password"
            label={t.platformUsers.password}
            rules={
              editing
                ? []
                : [{ required: true, message: fieldRequired(t, t.platformUsers.password) }]
            }
            extra={editing ? t.platformUsers.passwordEditHint : undefined}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          {editing && (
            <Form.Item
              name="is_active"
              label={t.platformUsers.active}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
