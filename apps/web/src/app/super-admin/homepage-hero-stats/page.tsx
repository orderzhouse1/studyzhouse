import type { Metadata } from "next";

import { AdminHomepageHeroStatsPanel } from "@/components/admin/admin-homepage-hero-stats-panel";

export const metadata: Metadata = {
  title: "إحصائيات الصفحة الرئيسية",
};

export default function SuperAdminHomepageHeroStatsPage(): React.ReactElement {
  return <AdminHomepageHeroStatsPanel />;
}
