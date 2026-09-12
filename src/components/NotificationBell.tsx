"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Dropdown, Empty, Tag, Typography, theme } from "antd";
import {
  BellOutlined,
  ExclamationCircleFilled,
  WarningFilled,
} from "@ant-design/icons";
import { useI18n } from "@/i18n/context";
import api from "@/lib/api";
import { ADMIN_ENDPOINTS } from "@/lib/endpoints";
import type { AdminNotification, ApiResponse, NotificationsResponse } from "@/lib/types";

const { Text } = Typography;

// Poll interval for the alert badge.
const REFRESH_MS = 60_000;

export default function NotificationBell() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>([]);

  // Poll inside the effect and only touch state from the response callback:
  // a synchronous setState in the effect body trips react-hooks/set-state-in-effect,
  // and the guard drops responses that land after the bell has unmounted.
  useEffect(() => {
    let cancelled = false;

    const load = () => {
      api
        .get<ApiResponse<NotificationsResponse>>(ADMIN_ENDPOINTS.NOTIFICATIONS)
        .then(({ data }) => {
          if (!cancelled) setItems(data.data?.items || []);
        })
        .catch(() => {
          /* non-critical */
        });
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const menu = (
    <div
      style={{
        width: 340,
        maxHeight: 420,
        overflowY: "auto",
        background: token.colorBgElevated,
        borderRadius: 8,
        boxShadow: token.boxShadowSecondary,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          fontWeight: 600,
        }}
      >
        {t.notifications.title}
        {items.length > 0 && (
          <Tag color="red" style={{ marginLeft: 8 }}>
            {items.length}
          </Tag>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{ padding: 24 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t.notifications.empty}
          />
        </div>
      ) : (
        items.map((n, i) => (
          <div
            key={i}
            onClick={() => router.push(`/companies/${n.tenant_id}`)}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = token.colorFillQuaternary)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {n.severity === "error" ? (
              <ExclamationCircleFilled
                style={{ color: token.colorError, fontSize: 18, marginTop: 2 }}
              />
            ) : (
              <WarningFilled
                style={{ color: token.colorWarning, fontSize: 18, marginTop: 2 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{n.tenant_name}</div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {n.message}
              </Text>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dropdown
      popupRender={() => menu}
      trigger={["click"]}
      placement="bottomRight"
    >
      <Badge count={items.length} size="small" offset={[-2, 2]}>
        <BellOutlined
          style={{ fontSize: 18, color: token.colorTextSecondary, cursor: "pointer" }}
        />
      </Badge>
    </Dropdown>
  );
}
