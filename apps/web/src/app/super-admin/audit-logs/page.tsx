import type { Metadata } from "next";

import { SuperAdminAuditLogsPanel } from "@/components/super-admin/super-admin-audit-logs-panel";

export const metadata: Metadata = {
  title: "سجل العمليات — المدير الأعلى",
};

export default function SuperAdminAuditLogsPage(): React.ReactElement {
  return <SuperAdminAuditLogsPanel />;
}
