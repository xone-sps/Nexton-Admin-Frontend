import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    // Primary — indigo to distinguish from company panel
    colorPrimary: "#6366F1",
    colorInfo: "#6366F1",

    // Text — dark navy
    colorTextBase: "#1A2038",

    // Backgrounds
    colorBgBase: "#FFFFFF",
    colorBgLayout: "#F5F6FA",
    colorBgContainer: "#FFFFFF",

    // Border
    colorBorder: "#E2E6EF",
    colorBorderSecondary: "#EEF0F5",

    // Typography
    fontFamily:
      "'Noto Sans Lao', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,

    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Spacing
    controlHeight: 40,

    // Success / Warning / Error
    colorSuccess: "#22C55E",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
  },
  components: {
    Layout: {
      siderBg: "#111827",
      headerBg: "#FFFFFF",
      bodyBg: "#F5F6FA",
    },
    Menu: {
      darkItemBg: "#111827",
      darkItemColor: "rgba(255, 255, 255, 0.65)",
      darkItemSelectedBg: "#6366F1",
      darkItemSelectedColor: "#FFFFFF",
      darkItemHoverColor: "#FFFFFF",
      darkItemHoverBg: "rgba(99, 102, 241, 0.15)",
      darkSubMenuItemBg: "#0D1117",
      itemBorderRadius: 8,
      itemMarginInline: 8,
      iconSize: 18,
    },
    Button: {
      primaryShadow: "0 2px 4px rgba(99, 102, 241, 0.25)",
      fontWeight: 500,
    },
    Card: {
      boxShadowTertiary: "0 1px 3px rgba(26, 32, 56, 0.06)",
    },
    Table: {
      headerBg: "#F8F9FC",
      headerColor: "#6B7280",
      rowHoverBg: "#F5F6FA",
    },
    Input: {
      activeBorderColor: "#6366F1",
      hoverBorderColor: "#A5B4FC",
    },
  },
};

export default theme;
