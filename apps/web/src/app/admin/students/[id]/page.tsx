import type { Metadata } from "next";

import { AdminStudentDetailClient } from "@/components/admin/admin-student-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "تفاصيل الطالب",
  };
}

export default async function AdminStudentDetailPage({
  params,
}: Props): Promise<React.ReactElement> {
  const { id } = await params;
  return <AdminStudentDetailClient studentId={id} />;
}
