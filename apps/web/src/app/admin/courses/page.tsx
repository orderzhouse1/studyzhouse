import type { Metadata } from "next";

import { AdminCoursesPanel } from "./admin-courses-panel";

export const metadata: Metadata = {
  title: "إدارة الكورسات",
};

export default function AdminCoursesPage(): React.ReactElement {
  return <AdminCoursesPanel />;
}
