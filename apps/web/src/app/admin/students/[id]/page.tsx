import type { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "تعديل الطالب",
  };
}

export default async function AdminStudentDetailPage({
  params,
}: Props): Promise<never> {
  const { id } = await params;
  redirect(`/admin/students?edit=${encodeURIComponent(id)}`);
}
