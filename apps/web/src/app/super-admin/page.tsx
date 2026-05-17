import type { Metadata } from "next";

import { AdminDashboardHome } from "@/components/admin/workspace/admin-dashboard-home";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

const QUICK_LINKS = [
  { label: "المدراء", href: "/super-admin/admins" },
  { label: "سجل العمليات", href: "/super-admin/audit-logs" },
  { label: "الإعدادات", href: "/super-admin/settings" },
];

export default function SuperAdminOverviewPage(): React.ReactElement {
  return (
    <AdminDashboardHome
      apiPath="/super-admin/overview"
      quickLinks={QUICK_LINKS}
    />
  );
}
