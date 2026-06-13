"use client";

import { AdminAuditLogsPanel } from "@/components/admin/audit-logs/admin-audit-logs-panel";

/** @deprecated استخدم AdminAuditLogsPanel مباشرة */
export function SuperAdminAuditLogsPanel(): React.ReactElement {
  return (
    <AdminAuditLogsPanel
      apiBase="/super-admin/audit-logs"
      title="سجل العمليات"
      description="الإجراءات الحساسة على مستوى المنصّة."
    />
  );
}
