import type { Metadata } from "next";

import { AdminStudentsPanel } from "@/components/admin/admin-students-panel";

export const metadata: Metadata = {
  title: "الطلاب",
};

export default function AdminStudentsPage(): React.ReactElement {
  return <AdminStudentsPanel />;
}
