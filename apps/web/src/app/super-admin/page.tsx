import type { Metadata } from "next";

import { SuperAdminOverviewPanel } from "@/components/super-admin/super-admin-overview-panel";

export const metadata: Metadata = {
  title: "نظرة عامة — المدير الأعلى",
};

export default function SuperAdminOverviewPage(): React.ReactElement {
  return <SuperAdminOverviewPanel />;
}
