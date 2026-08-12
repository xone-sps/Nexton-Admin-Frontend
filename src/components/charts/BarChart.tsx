"use client";

import { theme } from "antd";

export type BarDatum = {
  label: string;
  value: number;
  sublabel?: string;
};

/**
 * A lightweight, dependency-free responsive SVG bar chart. One accent color,
 * a single muted baseline, value labels above each bar. Scales to its container
 * width via a fixed viewBox.
 */
export function BarChart({
  data,
  color,
  height = 240,
  formatValue = (v) => String(v),
}: {
  data: BarDatum[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const { token } = theme.useToken();
  const accent = color || token.colorPrimary;

  const W = 640;
  const H = height;
  const padX = 16;
  const padTop = 28;
  const padBottom = data.some((d) => d.sublabel) ? 44 : 30;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length);
  const slot = innerW / n;
  const barW = Math.min(64, slot * 0.6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* baseline */}
      <line
        x1={padX}
        y1={padTop + innerH}
        x2={W - padX}
        y2={padTop + innerH}
        stroke={token.colorBorderSecondary}
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const h = max > 0 ? (d.value / max) * innerH : 0;
        const x = padX + i * slot + (slot - barW) / 2;
        const y = padTop + innerH - h;
        return (
          <g key={`${d.label}-${i}`}>
            {/* value label */}
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={token.colorText}
              >
                {formatValue(d.value)}
              </text>
            )}
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, d.value > 0 ? 2 : 0)}
              rx={4}
              fill={accent}
              opacity={0.9}
            >
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            </rect>
            {/* x label */}
            <text
              x={x + barW / 2}
              y={padTop + innerH + 16}
              textAnchor="middle"
              fontSize={11}
              fill={token.colorTextSecondary}
            >
              {d.label}
            </text>
            {d.sublabel && (
              <text
                x={x + barW / 2}
                y={padTop + innerH + 31}
                textAnchor="middle"
                fontSize={10}
                fill={token.colorTextTertiary}
              >
                {d.sublabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
