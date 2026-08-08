"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  InputNumber,
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
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import SearchInput from "@/components/SearchInput";
import SlugBadge from "@/components/SlugBadge";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { applyApiErrorToForm, getApiErrorMessage } from "@/lib/apiError";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import { fieldRequired, formatPrice, slugify } from "@/lib/format";
import { defaultPagination } from "@/lib/pagination";
import { useFormSubmittable } from "@/lib/useFormSubmittable";
import type { ApiResponse, Module, Package } from "@/lib/types";

const { Title } = Typography;

type PackageFormValues = {
  key: string;
  name: string;
  description: string;
  base_price: number;
  module_ids: string[];
  is_public: boolean;
};

export default function PackagesPage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [packages, setPackages] = useState<Package[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm<PackageFormValues>();
  const ok = useFormSubmittable(form, { initiallyEnabled: !!editingPackage });

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Package[]>>(
        ADMIN_ENDPOINTS.PACKAGES
      );
      setPackages(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    } finally {
      setLoading(false);
    }
  }, [message, t.common.loadFailed]);

  const fetchModules = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<Module[]>>(
        ADMIN_ENDPOINTS.MODULES
      );
      setModules(data.data || []);
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.loadFailed));
    }
  }, [message, t.common.loadFailed]);

  useEffect(() => {
    fetchPackages();
    fetchModules();
  }, [fetchPackages, fetchModules]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch =
        !search ||
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.key.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [packages, search]);

  const handleOpenCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({ is_public: true });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    form.setFieldsValue({
      key: pkg.key,
      name: pkg.name,
      description: pkg.description,
      base_price: pkg.base_price,
      is_public: pkg.is_public,
      module_ids: pkg.modules
        .filter((m) => m.is_included)
        .map((m) => m.module_id),
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: PackageFormValues) => {
    setSubmitting(true);
    try {
      if (editingPackage) {
        await api.put<ApiResponse<Package>>(
          ADMIN_ENDPOINTS.PACKAGE(editingPackage.id),
          {
            name: values.name,
            description: values.description,
            is_active: editingPackage.is_active,
            is_public: values.is_public,
            base_price: values.base_price,
            module_ids: values.module_ids,
          }
        );
        message.success(t.packages.updateSuccess);
      } else {
        await api.post<ApiResponse<Package>>(ADMIN_ENDPOINTS.PACKAGES, {
          key: values.key,
          name: values.name,
          description: values.description,
          is_public: values.is_public,
          base_price: values.base_price,
          module_ids: values.module_ids,
        });
        message.success(t.packages.createSuccess);
      }
      setDrawerOpen(false);
      form.resetFields();
      setEditingPackage(null);
      fetchPackages();
    } catch (err) {
      if (!applyApiErrorToForm(err, form)) {
        message.error(getApiErrorMessage(err, t.common.error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingPackage) {
      form.setFieldsValue({ key: slugify(name, "_") });
    }
  };

  const columns: ColumnsType<Package> = [
    {
      title: t.packages.packageName,
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t.packages.packageKey,
      dataIndex: "key",
      key: "key",
      render: (key: string) => <SlugBadge text={key} />,
    },
    {
      title: t.companies.modules,
      key: "modules",
      render: (_, record) => {
        const count = record.modules?.filter((m) => m.is_included).length || 0;
        return (
          <Tag color="blue">
            {count} {t.packages.modulesCount}
          </Tag>
        );
      },
    },
    {
      title: t.packages.basePrice,
      dataIndex: "base_price",
      key: "base_price",
      sorter: (a, b) => a.base_price - b.base_price,
      render: (price: number) => formatPrice(price),
    },
    {
      title: t.common.status,
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? t.common.active : t.common.inactive}
        </Tag>
      ),
    },
    {
      title: t.common.actions,
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Tooltip title={t.common.edit}>
          <Button
            type="link"
            icon={<EditOutlined />}
            aria-label={t.common.edit}
            onClick={() => handleOpenEdit(record)}
          >
            {t.common.edit}
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
          {t.packages.title}
        </Title>
        <Space>
          <Tooltip title={t.common.refresh}>
            <Button
              icon={<ReloadOutlined />}
              aria-label={t.common.refresh}
              onClick={fetchPackages}
            >
              {t.common.refresh}
            </Button>
          </Tooltip>
          <Tooltip title={t.packages.newPackage}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              aria-label={t.packages.newPackage}
              onClick={handleOpenCreate}
            >
              {t.packages.newPackage}
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
            placeholder={t.common.search + "..."}
            value={search}
            onChange={setSearch}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredPackages}
          rowKey="id"
          loading={loading}
          pagination={defaultPagination(t)}
        />
      </Card>

      {/* Create / Edit Package Drawer */}
      <Drawer
        title={editingPackage ? t.packages.editPackage : t.packages.newPackage}
        size={480}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
          setEditingPackage(null);
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                form.resetFields();
                setEditingPackage(null);
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
              {editingPackage ? t.common.save : t.common.create}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={t.packages.packageName}
            rules={[{ required: true, message: fieldRequired(t, t.packages.packageName) }]}
          >
            <Input
              placeholder={t.packages.placeholders.packageName}
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="key"
            label={t.packages.packageKey}
            rules={[
              { required: true, message: fieldRequired(t, t.packages.packageKey) },
              { pattern: /^[a-z0-9_]+$/, message: t.validation.slugInvalid },
            ]}
            extra={t.packages.keyHint}
          >
            <Input
              placeholder={t.packages.placeholders.packageKey}
              disabled={!!editingPackage}
              onChange={(e) => {
                form.setFieldsValue({ key: slugify(e.target.value, "_") });
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t.packages.description}
          >
            <Input.TextArea
              rows={3}
              placeholder={t.packages.placeholders.description}
            />
          </Form.Item>

          <Form.Item
            name="base_price"
            label={t.packages.basePrice}
            rules={[{ required: true, message: fieldRequired(t, t.packages.basePrice) }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number(value?.replace(/,/g, "") || 0) as 0
              }
              addonAfter="LAK"
              placeholder={t.packages.placeholders.basePrice}
            />
          </Form.Item>

          <Form.Item
            name="module_ids"
            label={t.packages.includedModules}
            rules={[
              {
                required: true,
                message: fieldRequired(t, t.packages.includedModules),
                type: "array",
              },
            ]}
          >
            <Checkbox.Group style={{ width: "100%" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {modules
                  .filter((m) => m.is_active)
                  .map((mod) => (
                    <Checkbox key={mod.id} value={mod.id}>
                      {mod.name}
                    </Checkbox>
                  ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="is_public"
            label={t.packages.isPublic}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
