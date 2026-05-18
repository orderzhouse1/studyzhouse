import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "طالب جديد",
};

export default function AdminStudentNewPage(): never {
  redirect("/admin/students?new=1");
}
