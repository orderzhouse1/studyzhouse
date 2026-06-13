import type { Metadata } from "next";

import { AdminReviewsPanel } from "@/components/admin/reviews/admin-reviews-panel";

export const metadata: Metadata = {
  title: "مراجعات الكورسات",
};

export default function AdminReviewsPage(): React.ReactElement {
  return <AdminReviewsPanel />;
}
