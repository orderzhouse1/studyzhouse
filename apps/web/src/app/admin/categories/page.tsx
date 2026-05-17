import type { Metadata } from "next";

import { AdminCategoriesPanel } from "./admin-categories-panel";

export const metadata: Metadata = {
  title: "إدارة التصنيفات",
};

export default function AdminCategoriesPage(): React.ReactElement {
  return <AdminCategoriesPanel />;
}
