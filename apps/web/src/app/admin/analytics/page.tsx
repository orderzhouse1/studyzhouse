import type { Metadata } from "next";

import { AdminAnalyticsPanel } from "@/components/admin/analytics/admin-analytics-panel";

export const metadata: Metadata = {
  title: "التحليلات",
};

export default function AdminAnalyticsPage(): React.ReactElement {
  return <AdminAnalyticsPanel />;
}
