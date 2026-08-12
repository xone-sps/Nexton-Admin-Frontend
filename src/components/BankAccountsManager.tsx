"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import type { ApiResponse, BankAccount } from "@/lib/types";

const { Text } = Typography;

type FormValues = {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export default function BankAccountsManager({ canEdit }: { canEdit: boolean }) {
  const { t } = useI18n();
  const { message, modal } = App.useApp();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiResponse<BankAccount[]>>(
        ADMIN_ENDPOINTS.BANK_ACCOUNTS
      );
      setAccounts(data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_default: accounts.length === 0 });
    setOpen(true);
  };

  const openEdit = (a: BankAccount) => {
    setEditing(a);
    form.setFieldsValue({
      bank_name: a.bank_name,
      account_name: a.account_name,
      account_number: a.account_number,
      branch: a.branch,
      is_active: a.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(ADMIN_ENDPOINTS.BANK_ACCOUNT(editing.id), {
          bank_name: values.bank_name,
          account_name: values.account_name,
          account_number: values.account_number,
          branch: values.branch || "",
          is_active: values.is_active,
        });
        message.success(t.bank.updated);
      } else {
        await api.post(ADMIN_ENDPOINTS.BANK_ACCOUNTS, {
          bank_name: values.bank_name,
          account_name: values.account_name,
          account_number: values.account_number,
          branch: values.branch || "",
          is_default: values.is_default ?? false,
        });
        message.success(t.bank.added);
      }
      setOpen(false);
      setEditing(null);
      fetchAccounts();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (a: BankAccount) => {
    try {
      await api.post(ADMIN_ENDPOINTS.BANK_ACCOUNT_DEFAULT(a.id), {});
      message.success(t.bank.defaultSet);
      fetchAccounts();
    } catch (err) {
      message.error(getApiErrorMessage(err, t.common.error));
    }
  };

  const handleDelete = (a: BankAccount) => {
    modal.confirm({
      title: t.common.delete,
      content: `${t.bank.deleteConfirm} (${a.bank_name})`,
      okText: t.common.delete,
      okButtonProps: { danger: true },
      cancelText: t.common.cancel,
      onOk: async () => {
        try {
          await api.delete(ADMIN_ENDPOINTS.BANK_ACCOUNT(a.id));
          message.success(t.bank.deleted);
          fetchAccounts();
        } catch (err) {
          message.error(getApiErrorMessage(err, t.common.error));
        }
      },
    });
  };

  const columns: ColumnsType<BankAccount> = [
    {
      title: t.bank.bankName,
      dataIndex: "bank_name",
      key: "bank_name",
      render: (name: string, r) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {r.is_default && (
            <Tag color="gold" icon={<StarFilled />}>
              {t.bank.default}
            </Tag>
          )}
          {!r.is_active && <Tag>{t.bank.inactive}</Tag>}
        </Space>
      ),
    },
    { title: t.bank.accountName, dataIndex: "account_name", key: "account_name" },
    {
      title: t.bank.accountNumber,
      dataIndex: "account_number",
      key: "account_number",
      render: (v: string) => <Text style={{ fontFamily: "monospace" }}>{v}</Text>,
    },
    { title: t.bank.branch, dataIndex: "branch", key: "branch" },
    ...(canEdit
      ? [
          {
            title: t.common.actions,
            key: "actions",
            width: 200,
            render: (_: unknown, r: BankAccount) => (
              <Space>
                <Tooltip title={t.bank.setDefault}>
                  <Button
                    type="link"
                    size="small"
                    icon={r.is_default ? <StarFilled /> : <StarOutlined />}
                    disabled={r.is_default}
                    onClick={() => handleSetDefault(r)}
                  />
                </Tooltip>
                <Tooltip title={t.common.edit}>
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(r)}
                  />
                </Tooltip>
                <Tooltip title={t.common.delete}>
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(r)}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text type="secondary">{t.bank.subtitle}</Text>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t.bank.addAccount}
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: t.bank.noAccounts }}
      />

      <Modal
        title={editing ? t.bank.editAccount : t.bank.addAccount}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        okText={editing ? t.common.save : t.common.create}
        confirmLoading={saving}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item
            name="bank_name"
            label={t.bank.bankName}
            rules={[{ required: true, message: t.validation.required }]}
          >
            <Input placeholder="BCEL" />
          </Form.Item>
          <Form.Item
            name="account_name"
            label={t.bank.accountName}
            rules={[{ required: true, message: t.validation.required }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="account_number"
            label={t.bank.accountNumber}
            rules={[{ required: true, message: t.validation.required }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="branch" label={t.bank.branch}>
            <Input />
          </Form.Item>
          {editing ? (
            <Form.Item name="is_active" label={t.bank.active} valuePropName="checked">
              <Switch />
            </Form.Item>
          ) : (
            <Form.Item name="is_default" valuePropName="checked">
              <Checkbox>{t.bank.makeDefault}</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
