"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  theme,
} from "antd";
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  PlusOutlined,
  StopOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import SlugBadge from "@/components/SlugBadge";
import { TenantBillingPanel } from "@/components/billing/TenantBillingPanel";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { applyApiErrorToForm, getApiErrorMessage } from "@/lib/apiError";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import { INDUSTRY_KEYS, SIZE_KEYS, LOGO_ACCEPT } from "@/lib/companyProfile";
import { fieldRequired } from "@/lib/format";
import { defaultPagination } from "@/lib/pagination";
import { useFormSubmittable } from "@/lib/useFormSubmittable";
import type {
  ApiResponse,
  Module,
  Package,
  PackageOption,
  Tenant,
  TenantRole,
  TenantUser,
} from "@/lib/types";

const { Title, Text } = Typography;
const TENANT_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN || "nexton.work";

export default function CompanyDetailPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [editForm] = Form.useForm();
  const editOk = useFormSubmittable(editForm, { initiallyEnabled: true });
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [userForm] = Form.useForm();
  const userOk = useFormSubmittable(userForm, { initiallyEnabled: !!editingUser });
  const [planOptions, setPlanOptions] = useState<PackageOption[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);

  const fetchTenant = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Tenant>>(
        ADMIN_ENDPOINTS.TENANT(tenantId)
      );
      setTenant(data.data);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [tenantId, message, t.common.loadFailed]);

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
          base_price: p.base_price,
          modules: (p.modules || [])
            .filter((m) => m.is_included)
            .map((m) => m.module_id),
        }))
      );
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    }
  }, [message, t.common.loadFailed]);

  const fetchModules = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Module[]>>(
        ADMIN_ENDPOINTS.MODULES
      );
      setAllModules(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    }
  }, [message, t.common.loadFailed]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get<ApiResponse<TenantUser[]>>(
        `${ADMIN_ENDPOINTS.TENANT(tenantId)}/users`
      );
      setUsers(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setUsersLoading(false);
    }
  }, [tenantId, message, t.common.loadFailed]);

  const fetchTenantRoles = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<TenantRole[]>>(
        ADMIN_ENDPOINTS.TENANT_ROLES(tenantId)
      );
      setTenantRoles(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    }
  }, [tenantId, message, t.common.loadFailed]);

  useEffect(() => {
    fetchTenant();
    fetchPackages();
    fetchModules();
    fetchTenantRoles();
  }, [fetchTenant, fetchPackages, fetchModules, fetchTenantRoles]);

  const handleStatusChange = (newStatus: "active" | "suspended") => {
    const isSuspend = newStatus === "suspended";
    modal.confirm({
      title: isSuspend ? t.companies.suspend : t.companies.activate,
      icon: <ExclamationCircleOutlined />,
      content: isSuspend
        ? t.companies.suspendConfirm
        : t.companies.activateConfirm,
      okText: t.common.confirm,
      cancelText: t.common.cancel,
      okButtonProps: { danger: isSuspend },
      onOk: async () => {
        setUpdatingStatus(true);
        try {
          await api.put<ApiResponse<Tenant>>(ADMIN_ENDPOINTS.TENANT(tenantId), {
            status: newStatus,
          });
          message.success(t.companies.statusUpdated);
          fetchTenant();
        } catch (err) {
          message.error(getApiErrorMessage(err, t.common.error));
        } finally {
          setUpdatingStatus(false);
        }
      },
    });
  };

  const handlePlanChange = async () => {
    if (!selectedPlan || selectedPlan === tenant?.plan) return;
    setUpdatingPlan(true);
    try {
      await api.put<ApiResponse<Tenant>>(ADMIN_ENDPOINTS.TENANT(tenantId), {
        plan: selectedPlan,
      });
      message.success(t.companies.planUpdated);
      setChangePlanOpen(false);
      fetchTenant();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleEdit = async () => {
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    setEditLoading(true);
    try {
      await api.put<ApiResponse<Tenant>>(
        ADMIN_ENDPOINTS.TENANT(tenantId),
        values
      );
      message.success(t.companies.companyUpdated);
      setEditOpen(false);
      fetchTenant();
    } catch (err) {
      if (!applyApiErrorToForm(err, editForm)) {
        message.error(getApiErrorMessage(err, t.common.error));
      }
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = () => {
    editForm.setFieldsValue({
      name: tenant?.name,
      plan: tenant?.plan,
      status: tenant?.status,
      industry: tenant?.industry || undefined,
      company_size: tenant?.company_size || undefined,
      about: tenant?.about || "",
    });
    setEditOpen(true);
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(ADMIN_ENDPOINTS.TENANT_LOGO(tenantId), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success(t.companies.logoUpdated);
      fetchTenant();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setLogoUploading(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalOpen(true);
  };

  const openEditUser = (user: TenantUser) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
    });
    setUserModalOpen(true);
  };

  const handleUserSubmit = async () => {
    let values;
    try {
      values = await userForm.validateFields();
    } catch {
      return;
    }
    setUserModalLoading(true);
    try {
      if (editingUser) {
        const payload: Record<string, unknown> = {};
        if (values.email !== editingUser.email) payload.email = values.email;
        if (values.first_name !== editingUser.first_name) payload.first_name = values.first_name;
        if (values.last_name !== editingUser.last_name) payload.last_name = values.last_name;
        if (values.role !== editingUser.role) payload.role = values.role;
        if (values.is_active !== editingUser.is_active) payload.is_active = values.is_active;
        if (values.password) payload.password = values.password;

        await api.put<ApiResponse<TenantUser>>(
          `${ADMIN_ENDPOINTS.TENANT(tenantId)}/users/${editingUser.id}`,
          payload
        );
        message.success(t.companies.userUpdated);
      } else {
        await api.post<ApiResponse<TenantUser>>(
          `${ADMIN_ENDPOINTS.TENANT(tenantId)}/users`,
          values
        );
        message.success(t.companies.userCreated);
      }

      setUserModalOpen(false);
      fetchUsers();
      fetchTenant();
    } catch (err) {
      if (!applyApiErrorToForm(err, userForm)) {
        message.error(getApiErrorMessage(err, t.common.error));
      }
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    if (key === "users" && users.length === 0) {
      fetchUsers();
    }
  };

  const userColumns: ColumnsType<TenantUser> = [
    {
      title: t.companies.adminFirstName,
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: t.companies.adminLastName,
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: t.auth.email,
      dataIndex: "email",
      key: "email",
    },
    {
      title: t.companies.roleLabel,
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : role === "superadmin" ? "purple" : role === "hr_manager" ? "cyan" : "default"}>
          {role}
        </Tag>
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
      title: t.companies.createdDate,
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t.common.actions,
      key: "actions",
      render: (_: unknown, record: TenantUser) => (
        <Tooltip title={t.common.edit}>
          <Button
            type="link"
            icon={<EditOutlined />}
            aria-label={t.common.edit}
            onClick={() => openEditUser(record)}
          >
            {t.common.edit}
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Text type="secondary">{t.common.noData}</Text>
      </div>
    );
  }

  const currentPlanModules =
    planOptions.find((p) => p.value === tenant.plan)?.modules ||
    tenant.modules ||
    [];
  const tenantDomain = `${tenant.slug}.${TENANT_ROOT_DOMAIN}`;
  const tenantUrl = `https://${tenantDomain}`;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Tooltip title={t.common.back}>
          <Button
            icon={<ArrowLeftOutlined />}
            aria-label={t.common.back}
            onClick={() => router.push("/companies")}
          >
            {t.common.back}
          </Button>
        </Tooltip>
        <Avatar
          shape="square"
          size={48}
          src={tenant.logo_url || undefined}
          icon={<BankOutlined />}
          style={{ backgroundColor: token.colorFillSecondary, flexShrink: 0 }}
        />
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {tenant.name}
          </Title>
          <Text type="secondary">
            <SlugBadge text={tenant.slug} />
          </Text>
        </div>
      </div>

      <Card>
        <Tabs
          defaultActiveKey="overview"
          onChange={handleTabChange}
          items={[
            {
              key: "overview",
              label: t.companies.overview,
              children: (
                <div>
                  <Descriptions
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    style={{ marginBottom: 24 }}
                    items={[
                      {
                        key: "name",
                        label: t.companies.companyName,
                        children: tenant.name,
                      },
                      {
                        key: "slug",
                        label: t.companies.slug,
                        children: <code>{tenant.slug}</code>,
                      },
                      {
                        key: "domain",
                        label: t.companies.tenantDomain,
                        children: (
                          <Space>
                            <Tooltip title={t.common.openExternal}>
                              <Button
                                type="link"
                                size="small"
                                href={tenantUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                icon={<LinkOutlined />}
                                aria-label={t.common.openExternal}
                              >
                                {tenantDomain}
                              </Button>
                            </Tooltip>
                            <Tooltip title={t.common.copy}>
                              <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                aria-label={t.common.copy}
                                onClick={() => {
                                  navigator.clipboard.writeText(tenantUrl);
                                  message.success(t.companies.domainCopied);
                                }}
                              />
                            </Tooltip>
                          </Space>
                        ),
                      },
                      {
                        key: "status",
                        label: t.common.status,
                        children: (
                          <Tag
                            color={tenant.status === "active" ? "green" : "red"}
                            icon={
                              tenant.status === "active" ? (
                                <CheckCircleOutlined />
                              ) : (
                                <StopOutlined />
                              )
                            }
                          >
                            {tenant.status === "active"
                              ? t.common.active
                              : t.companies.suspended}
                          </Tag>
                        ),
                      },
                      {
                        key: "plan",
                        label: t.companies.plan,
                        children: (
                          <Tag color={"blue"}>
                            {planOptions.find((p) => p.value === tenant.plan)?.label ||
                              (tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1))}
                          </Tag>
                        ),
                      },
                      {
                        key: "db",
                        label: t.companies.databaseName,
                        children: (
                          <code>{tenant.db_name || `nexton_${tenant.slug.replace(/-/g, "_")}`}</code>
                        ),
                      },
                      {
                        key: "created",
                        label: t.companies.createdDate,
                        children: new Date(tenant.created_at).toLocaleDateString(),
                      },
                      {
                        key: "industry",
                        label: t.companies.industry,
                        children: tenant.industry ? (
                          t.companies.industries[
                            tenant.industry as keyof typeof t.companies.industries
                          ] || tenant.industry
                        ) : (
                          <Text type="secondary">{t.companies.notSet}</Text>
                        ),
                      },
                      {
                        key: "size",
                        label: t.companies.companySize,
                        children: tenant.company_size ? (
                          t.companies.sizes[
                            tenant.company_size as keyof typeof t.companies.sizes
                          ] || tenant.company_size
                        ) : (
                          <Text type="secondary">{t.companies.notSet}</Text>
                        ),
                      },
                      {
                        key: "about",
                        label: t.companies.about,
                        children: tenant.about ? (
                          <span style={{ whiteSpace: "pre-wrap" }}>{tenant.about}</span>
                        ) : (
                          <Text type="secondary">{t.companies.notSet}</Text>
                        ),
                      },
                    ]}
                  />

                  <Space>
                    <Tooltip title={t.common.edit}>
                      <Button
                        icon={<EditOutlined />}
                        aria-label={t.common.edit}
                        onClick={openEditModal}
                      >
                        {t.common.edit}
                      </Button>
                    </Tooltip>
                    {tenant.status === "active" ? (
                      <Tooltip title={t.companies.suspend}>
                        <Button
                          danger
                          icon={<StopOutlined />}
                          aria-label={t.companies.suspend}
                          loading={updatingStatus}
                          onClick={() => handleStatusChange("suspended")}
                        >
                          {t.companies.suspend}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t.companies.activate}>
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          aria-label={t.companies.activate}
                          loading={updatingStatus}
                          onClick={() => handleStatusChange("active")}
                          style={{ background: token.colorSuccess, borderColor: token.colorSuccess }}
                        >
                          {t.companies.activate}
                        </Button>
                      </Tooltip>
                    )}
                  </Space>
                </div>
              ),
            },
            {
              key: "users",
              label: t.companies.users,
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <Tooltip title={t.companies.addUser}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        aria-label={t.companies.addUser}
                        onClick={openAddUser}
                      >
                        {t.companies.addUser}
                      </Button>
                    </Tooltip>
                  </div>
                  <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    loading={usersLoading}
                    pagination={defaultPagination(t)}
                  />
                </div>
              ),
            },
            {
              key: "subscription",
              label: t.companies.subscription,
              children: (
                <div>
                  <Descriptions
                    bordered
                    column={1}
                    style={{ marginBottom: 24 }}
                    items={[
                      {
                        key: "plan",
                        label: t.companies.plan,
                        children: (
                          <Space>
                            <Tag
                              color={"blue"}
                              style={{ fontSize: 14, padding: "4px 12px" }}
                            >
                              {planOptions.find((p) => p.value === tenant.plan)?.label ||
                                (tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1))}
                            </Tag>
                            <Button
                              type="link"
                              onClick={() => {
                                setSelectedPlan(tenant.plan);
                                setChangePlanOpen(true);
                              }}
                            >
                              {t.companies.changePlan}
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />

                  <Title level={5} style={{ marginBottom: 16 }}>
                    {t.companies.modules}
                  </Title>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {allModules.map((mod) => {
                      const isActive = currentPlanModules.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: `1px solid ${isActive ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                            background: isActive ? token.colorSuccessBg : token.colorFillQuaternary,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: 500,
                              color: isActive ? token.colorText : token.colorTextTertiary,
                            }}
                          >
                            {mod.name}
                          </Text>
                          <Tag
                            color={isActive ? "green" : "default"}
                            style={{ margin: 0 }}
                          >
                            {isActive ? t.common.active : t.common.inactive}
                          </Tag>
                        </div>
                      );
                    })}
                  </div>

                  <Title level={5} style={{ margin: "28px 0 16px" }}>
                    {t.billing.title}
                  </Title>
                  <TenantBillingPanel
                    tenantId={tenantId}
                    subscription={tenant.subscription}
                    onChanged={fetchTenant}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? t.companies.editUser : t.companies.addUser}
        open={userModalOpen}
        onOk={handleUserSubmit}
        onCancel={() => setUserModalOpen(false)}
        confirmLoading={userModalLoading}
        okText={editingUser ? t.common.save : t.common.create}
        cancelText={t.common.cancel}
        width={520}
        okButtonProps={{ disabled: !userOk }}
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="first_name"
              label={t.companies.adminFirstName}
              rules={[{ required: true, message: fieldRequired(t, t.companies.adminFirstName) }]}
              style={{ flex: 1 }}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="last_name"
              label={t.companies.adminLastName}
              rules={[{ required: true, message: fieldRequired(t, t.companies.adminLastName) }]}
              style={{ flex: 1 }}
            >
              <Input size="large" />
            </Form.Item>
          </div>
          <Form.Item
            name="email"
            label={t.auth.email}
            rules={[
              { required: true, message: fieldRequired(t, t.auth.email) },
              { type: "email", message: t.validation.email },
            ]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? `${t.auth.password} (${t.companies.keepCurrentPasswordHint})` : t.auth.password}
            rules={editingUser ? [] : [{ required: true, message: fieldRequired(t, t.auth.password) }, { min: 8, message: t.validation.passwordMin8 }]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item
            name="role"
            label={t.companies.roleLabel}
            rules={[{ required: true, message: fieldRequired(t, t.companies.roleLabel) }]}
            initialValue="employee"
          >
            <Select
              size="large"
              loading={tenantRoles.length === 0}
              options={tenantRoles.map((r) => {
                const translated =
                  r.value === "admin" ? t.companies.roles.admin :
                  r.value === "hr_manager" ? t.companies.roles.hrManager :
                  r.value === "manager" ? t.companies.roles.manager :
                  r.value === "employee" ? t.companies.roles.employee :
                  r.name;
                return { value: r.value, label: translated };
              })}
            />
          </Form.Item>
          {editingUser && (
            <Form.Item
              name="is_active"
              label={t.common.status}
              valuePropName="checked"
            >
              <Select size="large" options={[
                { value: true, label: t.common.active },
                { value: false, label: t.common.inactive },
              ]} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        title={`${t.common.edit} ${t.companies.companyName}`}
        open={editOpen}
        onOk={handleEdit}
        onCancel={() => setEditOpen(false)}
        confirmLoading={editLoading}
        okText={t.common.save}
        cancelText={t.common.cancel}
        okButtonProps={{ disabled: !editOk }}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label={t.companies.logo}>
            <Space size={16} align="center">
              <Avatar
                shape="square"
                size={64}
                src={tenant.logo_url || undefined}
                icon={<BankOutlined />}
                style={{ backgroundColor: token.colorFillSecondary }}
              />
              <Upload
                accept={LOGO_ACCEPT}
                showUploadList={false}
                beforeUpload={(file) => {
                  handleLogoUpload(file as File);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={logoUploading}>
                  {t.companies.changeLogo}
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.companies.logoHint}
              </Text>
            </Space>
          </Form.Item>
          <Form.Item
            name="name"
            label={t.companies.companyName}
            rules={[{ required: true, message: fieldRequired(t, t.companies.companyName) }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="plan"
            label={t.companies.plan}
            rules={[{ required: true, message: fieldRequired(t, t.companies.plan) }]}
          >
            <Select
              size="large"
              options={planOptions.map((p) => ({
                value: p.value,
                label: (
                  <div>
                    <span style={{ fontWeight: 600 }}>{p.label}</span>
                    <span style={{ color: token.colorTextTertiary, marginLeft: 8, fontSize: 12 }}>
                      ({p.modules?.length ?? 0} {t.packages.modulesCount} - {Intl.NumberFormat("en-US").format(p.base_price ?? 0)} LAK)
                    </span>
                  </div>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={t.common.status}
            rules={[{ required: true, message: fieldRequired(t, t.common.status) }]}
          >
            <Select
              size="large"
              options={[
                { value: "active", label: t.common.active },
                { value: "suspended", label: t.companies.suspended },
                { value: "trial", label: t.common.trial },
              ]}
            />
          </Form.Item>
          <Form.Item name="industry" label={t.companies.industry}>
            <Select
              size="large"
              allowClear
              placeholder={t.companies.industry}
              options={INDUSTRY_KEYS.map((k) => ({
                value: k,
                label: t.companies.industries[k],
              }))}
            />
          </Form.Item>
          <Form.Item name="company_size" label={t.companies.companySize}>
            <Select
              size="large"
              allowClear
              placeholder={t.companies.companySize}
              options={SIZE_KEYS.map((k) => ({
                value: k,
                label: t.companies.sizes[k],
              }))}
            />
          </Form.Item>
          <Form.Item name="about" label={t.companies.about}>
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        title={t.companies.changePlan}
        open={changePlanOpen}
        onOk={handlePlanChange}
        onCancel={() => setChangePlanOpen(false)}
        confirmLoading={updatingPlan}
        okText={t.common.confirm}
        cancelText={t.common.cancel}
        okButtonProps={{ disabled: !selectedPlan || selectedPlan === tenant.plan }}
      >
        <div style={{ marginTop: 16 }}>
          <Select
            value={selectedPlan}
            onChange={setSelectedPlan}
            style={{ width: "100%" }}
            size="large"
            options={planOptions.map((p) => ({
              value: p.value,
              label: (
                <div style={{ padding: "4px 0" }}>
                  <div style={{ fontWeight: 600 }}>
                    {p.label}
                    <span style={{ fontWeight: 400, marginLeft: 8, color: token.colorTextTertiary, fontSize: 12 }}>
                      {Intl.NumberFormat("en-US").format(p.base_price ?? 0)} LAK
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
                    {p.modules?.length ?? 0} {t.packages.modulesCount}
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}
