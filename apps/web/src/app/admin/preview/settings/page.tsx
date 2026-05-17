import type { Metadata } from "next";

import { AdminPreviewPage } from "@/components/admin/workspace/admin-preview-page";

export const metadata: Metadata = {
  title: "إعدادات المنصّة",
};

export default function AdminSettingsPreviewPage(): React.ReactElement {
  return (
    <AdminPreviewPage
      title="إعدادات المنصّة"
      description="إدارة إعدادات المنصّة العامة، التكاملات، وقوالب الرسائل — واجهة معاينة قبل التفعيل."
      backHref="/admin"
    />
  );
}
