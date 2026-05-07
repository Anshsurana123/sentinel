"use client";

import dynamic from "next/dynamic";

const IntelligenceBanner = dynamic(
  () => import("@/components/intelligence/IntelligenceBanner"),
  { ssr: false }
);

export default function IntelligenceBannerClient() {
  return <IntelligenceBanner />;
}
