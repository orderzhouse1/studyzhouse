import type { Metadata } from "next";

import { AdminPreviewPage } from "@/components/admin/workspace/admin-preview-page";

export const metadata: Metadata = {
  title: "التحليلات",
};

export default function AdminAnalyticsPreviewPage(): React.ReactElement {
  return (
    <AdminPreviewPage
      title="التحليلات"
      description="لوحة تحليلات تفاعلية لقياس نمو المستخدمين والتسجيلات والإيرادات — قيد التطوير."
      backHref="/admin"
    />
  );
}
