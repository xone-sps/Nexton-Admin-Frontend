"use client";

import Image from "next/image";

type LogoProps = {
  collapsed?: boolean;
  variant?: "dark" | "white";
};

export default function Logo({ collapsed = false, variant = "white" }: LogoProps) {
  if (collapsed) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <Image src="/favicon.svg" alt="N>" width={36} height={36} preload />
      </div>
    );
  }

  const src = variant === "white" ? "/logo-white.svg" : "/logo.svg";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <Image src={src} alt="Nexton" width={150} height={36} style={{ width: "auto", height: "auto", objectFit: "contain" }} preload />
    </div>
  );
}
