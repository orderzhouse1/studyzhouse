import type { Metadata } from "next";

import { AdminHomepageHeroStatsPanel } from "@/components/admin/admin-homepage-hero-stats-panel";

export const metadata: Metadata = {
  title: "إحصائيات الصفحة الرئيسية",
};

export default function AdminHomepageHeroStatsPage(): React.ReactElement {
  return <AdminHomepageHeroStatsPanel />;
}
