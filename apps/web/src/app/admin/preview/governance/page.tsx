import type { Metadata } from "next";

import { AdminPreviewPage } from "@/components/admin/workspace/admin-preview-page";

export const metadata: Metadata = {
  title: "الحوكمة",
};

export default function AdminGovernancePreviewPage(): React.ReactElement {
  return (
    <AdminPreviewPage
      title="الحوكمة والصلاحيات"
      description="سياسات الوصول، أدوار الفريق، وسجلات المراجعة المتقدمة — معاينة التصميم."
      backHref="/admin"
    />
  );
}
