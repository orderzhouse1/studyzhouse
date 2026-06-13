import type { Metadata } from "next";

import { AdminAuditLogsPanel } from "@/components/admin/audit-logs/admin-audit-logs-panel";

export const metadata: Metadata = {
  title: "سجل العمليات",
};

export default function AdminAuditLogsPage(): React.ReactElement {
  return <AdminAuditLogsPanel apiBase="/admin/audit-logs" />;
}
