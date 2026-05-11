import type { Metadata } from "next";

import { AdminPaymentRequestsPanel } from "@/components/admin/admin-payment-requests-panel";

export const metadata: Metadata = {
  title: "طلبات الدفع",
};

export default function AdminPaymentRequestsPage(): React.ReactElement {
  return <AdminPaymentRequestsPanel />;
}
