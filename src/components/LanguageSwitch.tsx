"use client";

import { Button, Dropdown } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useI18n, type Locale } from "@/i18n/context";

const languages: { key: Locale; label: string }[] = [
  { key: "lo", label: "ລາວ" },
  { key: "en", label: "English" },
];

export default function LanguageSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <Dropdown
      menu={{
        items: languages.map((lang) => ({
          key: lang.key,
          label: lang.label,
        })),
        selectedKeys: [locale],
        onClick: ({ key }) => setLocale(key as Locale),
      }}
      trigger={["click"]}
    >
      <Button type="text" icon={<GlobalOutlined />} style={{ color: "#6B7280" }}>
        {locale === "lo" ? "ລາວ" : "EN"}
      </Button>
    </Dropdown>
  );
}
