"use client";

import { theme } from "antd";

type SlugBadgeProps = {
  text: string;
};

export default function SlugBadge({ text }: SlugBadgeProps) {
  const { token } = theme.useToken();

  return (
    <code
      style={{
        background: token.colorFillTertiary,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 13,
      }}
    >
      {text}
    </code>
  );
}
