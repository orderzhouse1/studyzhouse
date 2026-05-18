import type { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "مراجعة طلب دفع",
  };
}

export default async function AdminPaymentRequestDetailPage({
  params,
}: Props): Promise<never> {
  const { id } = await params;
  redirect(`/admin/payment-requests?edit=${encodeURIComponent(id)}`);
}
