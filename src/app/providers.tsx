"use client";

import { ConfigProvider, App } from "antd";
import { I18nProvider } from "@/i18n/context";
import theme from "@/theme/themeConfig";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </I18nProvider>
  );
}
