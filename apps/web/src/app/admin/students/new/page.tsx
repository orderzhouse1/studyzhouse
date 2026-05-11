import type { Metadata } from "next";

import { AdminStudentNewForm } from "@/components/admin/admin-student-new-form";

export const metadata: Metadata = {
  title: "طالب جديد",
};

export default function AdminStudentNewPage(): React.ReactElement {
  return <AdminStudentNewForm />;
}
