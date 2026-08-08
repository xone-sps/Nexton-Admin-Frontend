"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";

type SearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <Input
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ maxWidth: 320 }}
      allowClear
    />
  );
}
