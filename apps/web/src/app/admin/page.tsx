import type { Metadata } from "next";

import { AdminDashboardHome } from "@/components/admin/workspace/admin-dashboard-home";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

const QUICK_LINKS = [
  { label: "الكورسات", href: "/admin/courses" },
  { label: "الطلاب", href: "/admin/students" },
  { label: "طلبات الدفع", href: "/admin/payment-requests" },
  { label: "التصنيفات", href: "/admin/categories" },
];

export default function AdminHomePage(): React.ReactElement {
  return <AdminDashboardHome apiPath={null} quickLinks={QUICK_LINKS} />;
}
