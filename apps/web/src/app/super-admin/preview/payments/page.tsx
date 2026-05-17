import type { Metadata } from "next";

import { AdminPreviewPage } from "@/components/admin/workspace/admin-preview-page";

export const metadata: Metadata = {
  title: "المدفوعات",
};

export default function SuperAdminPaymentsPreviewPage(): React.ReactElement {
  return (
    <AdminPreviewPage
      title="إدارة المدفوعات"
      description="نظرة مركزية على المدفوعات والنزاعات عبر كل المدراء — معاينة الواجهة."
      backHref="/super-admin"
    />
  );
}
