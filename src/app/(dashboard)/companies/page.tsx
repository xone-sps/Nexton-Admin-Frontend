"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import SearchInput from "@/components/SearchInput";
import SlugBadge from "@/components/SlugBadge";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { applyApiErrorToForm, getApiErrorMessage } from "@/lib/apiError";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import { fieldRequired, slugify } from "@/lib/format";
import { defaultPagination } from "@/lib/pagination";
import { useFormSubmittable } from "@/lib/useFormSubmittable";
import type { ApiResponse, Package, PackageOption, Tenant } from "@/lib/types";

const { Title } = Typography;

type CreateCompanyFormValues = {
  name: string;
  slug: string;
  plan: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
};

export default function CompaniesPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planOptions, setPlanOptions] = useState<PackageOption[]>([]);
  const [form] = Form.useForm<CreateCompanyFormValues>();
  const ok = useFormSubmittable(form);

  const fetchPackages = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Package[]>>(
        ADMIN_ENDPOINTS.PACKAGES
      );
      const pkgs = data.data || [];
      setPlanOptions(
        pkgs.map((p) => ({
          value: p.key,
          label: p.name,
          description: `${p.modules?.filter((m) => m.is_included).length || 0} ${t.packages.modulesCount} - ${Intl.NumberFormat("en-US").format(p.base_price)} LAK`,
          modules_count: p.modules?.filter((m) => m.is_included).length || 0,
        }))
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    }
  }, [message, t.common.loadFailed, t.packages.modulesCount]);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Tenant[]>>(
        ADMIN_ENDPOINTS.TENANTS
      );
      setTenants(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [message, t.common.loadFailed]);

  useEffect(() => {
    fetchTenants();
    fetchPackages();
  }, [fetchTenants, fetchPackages]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        !search ||
        tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  const handleCreate = async (values: CreateCompanyFormValues) => {
    setCreating(true);
    try {
      await api.post<ApiResponse<Tenant>>(ADMIN_ENDPOINTS.TENANTS, values);
      message.success(t.companies.createSuccess);
      setDrawerOpen(false);
      form.resetFields();
      fetchTenants();
    } catch (err) {
      if (!applyApiErrorToForm(err, form)) {
        message.error(getApiErrorMessage(err, t.companies.createError));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setFieldsValue({ slug: slugify(name) });
  };

  const columns: ColumnsType<Tenant> = [
    {
      title: t.companies.companyName,
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t.companies.slug,
      dataIndex: "slug",
      key: "slug",
      render: (slug: string) => <SlugBadge text={slug} />,
    },
    {
      title: t.companies.plan,
      dataIndex: "plan",
      key: "plan",
      render: (plan: string) => {
        const pkg = planOptions.find((p) => p.value === plan);
        return (
          <Tag color="blue">
            {pkg?.label || (plan?.charAt(0).toUpperCase() + plan?.slice(1))}
          </Tag>
        );
      },
      filters: planOptions.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.plan === value,
    },
    {
      title: t.common.status,
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? t.common.active : t.companies.suspended}
        </Tag>
      ),
    },
    {
      title: t.companies.users,
      dataIndex: "user_count",
      key: "user_count",
      sorter: (a, b) => (a.user_count || 0) - (b.user_count || 0),
      render: (count: number) => count || 0,
    },
    {
      title: t.companies.createdDate,
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t.common.actions,
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Tooltip title={t.common.view}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            aria-label={t.common.view}
            onClick={() => router.push(`/companies/${record.id}`)}
          >
            {t.common.view}
          </Button>
        </Tooltip>
      ),
    },
  ];

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
          {t.companies.title}
        </Title>
        <Space>
          <Tooltip title={t.common.refresh}>
            <Button
              icon={<ReloadOutlined />}
              aria-label={t.common.refresh}
              onClick={fetchTenants}
            >
              {t.common.refresh}
            </Button>
          </Tooltip>
          <Tooltip title={t.companies.newCompany}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              aria-label={t.companies.newCompany}
              onClick={() => setDrawerOpen(true)}
            >
              {t.companies.newCompany}
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <SearchInput
            placeholder={t.companies.searchPlaceholder}
            value={search}
            onChange={setSearch}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: t.common.all },
              { value: "active", label: t.common.active },
              { value: "suspended", label: t.companies.suspended },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredTenants}
          rowKey="id"
          loading={loading}
          pagination={defaultPagination(t)}
        />
      </Card>

      {/* Create Company Drawer */}
      <Drawer
        title={t.companies.newCompany}
        size={480}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => { setDrawerOpen(false); form.resetFields(); }}>
              {t.common.cancel}
            </Button>
            <Button type="primary" loading={creating} disabled={!ok} onClick={() => form.submit()}>
              {t.common.create}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label={t.companies.companyName}
            rules={[{ required: true, message: fieldRequired(t, t.companies.companyName) }]}
          >
            <Input
              placeholder={t.companies.placeholders.companyName}
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="slug"
            label={t.companies.slug}
            rules={[
              { required: true, message: fieldRequired(t, t.companies.slug) },
              { pattern: /^[a-z0-9-]+$/, message: t.validation.slugInvalid },
            ]}
            extra={t.companies.slugHint}
          >
            <Input
              placeholder={t.companies.placeholders.slug}
              onChange={(e) => {
                form.setFieldsValue({ slug: slugify(e.target.value) });
              }}
            />
          </Form.Item>

          <Form.Item
            name="plan"
            label={t.companies.plan}
            rules={[{ required: true, message: fieldRequired(t, t.companies.plan) }]}
          >
            <Select
              placeholder={t.companies.placeholders.plan}
              options={planOptions.map((p) => ({
                value: p.value,
                label: (
                  <div>
                    <span style={{ fontWeight: 500 }}>{p.label}</span>
                    <span
                      style={{
                        marginLeft: 8,
                        color: token.colorTextTertiary,
                        fontSize: 12,
                      }}
                    >
                      {p.description}
                    </span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <div
            style={{
              background: token.colorBgLayout,
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <Typography.Text
              strong
              style={{ display: "block", marginBottom: 12 }}
            >
              {t.companies.adminSection}
            </Typography.Text>

            <Form.Item
              name="admin_email"
              label={t.companies.adminEmail}
              rules={[
                { required: true, message: fieldRequired(t, t.companies.adminEmail) },
                { type: "email", message: t.validation.email },
              ]}
            >
              <Input placeholder={t.companies.placeholders.adminEmail} />
            </Form.Item>

            <Form.Item
              name="admin_password"
              label={t.companies.adminPassword}
              rules={[
                { required: true, message: fieldRequired(t, t.companies.adminPassword) },
                { min: 8, message: t.validation.passwordMin },
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
            name="admin_first_name"
            label={t.companies.adminFirstName}
              rules={[{ required: true, message: fieldRequired(t, t.companies.adminFirstName) }]}
            >
              <Input placeholder={t.companies.placeholders.adminFirstName} />
            </Form.Item>

            <Form.Item
            name="admin_last_name"
            label={t.companies.adminLastName}
              rules={[{ required: true, message: fieldRequired(t, t.companies.adminLastName) }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder={t.companies.placeholders.adminLastName} />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
