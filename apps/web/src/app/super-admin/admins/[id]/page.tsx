import type { Metadata } from "next";

import { SuperAdminAdminDetailPanel } from "@/components/super-admin/super-admin-admin-detail-panel";

export const metadata: Metadata = {
  title: "ملف أدمن — المدير الأعلى",
};

export default async function SuperAdminAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return <SuperAdminAdminDetailPanel adminId={id} />;
}
