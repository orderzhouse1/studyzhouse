import type { Metadata } from "next";

import { AdminAuditLogsPanel } from "@/components/admin/audit-logs/admin-audit-logs-panel";

export const metadata: Metadata = {
  title: "سجل العمليات — المدير الأعلى",
};

export default function SuperAdminAuditLogsPage(): React.ReactElement {
  return (
    <AdminAuditLogsPanel
      apiBase="/super-admin/audit-logs"
      title="سجل العمليات"
      description="الإجراءات الحساسة على مستوى المنصّة — مع تفاصيل before/after للعمليات المهمة."
    />
  );
}
