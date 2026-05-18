import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminPaymentRequestsPanel } from "./admin-payment-requests-panel";

export const metadata: Metadata = {
  title: "طلبات الدفع",
};

export default function AdminPaymentRequestsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-64 animate-pulse rounded-xl bg-muted/25" />
        </div>
      }
    >
      <AdminPaymentRequestsPanel />
    </Suspense>
  );
}
