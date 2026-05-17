import type { Metadata } from "next";

import { AdminPreviewPage } from "@/components/admin/workspace/admin-preview-page";

export const metadata: Metadata = {
  title: "التحليلات",
};

export default function SuperAdminAnalyticsPreviewPage(): React.ReactElement {
  return (
    <AdminPreviewPage
      title="التحليلات"
      description="تقارير شاملة على مستوى المنصّة لمدير النظام الأعلى — قيد التطوير."
      backHref="/super-admin"
    />
  );
}
