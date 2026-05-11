import type { Metadata } from "next";

import { AdminPaymentRequestDetailPanel } from "@/components/admin/admin-payment-request-detail-panel";

export const metadata: Metadata = {
  title: "مراجعة طلب دفع",
};

export default async function AdminPaymentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  return <AdminPaymentRequestDetailPanel paymentRequestId={id} />;
}
