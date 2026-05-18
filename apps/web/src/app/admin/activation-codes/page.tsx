import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminActivationCodesPanel } from "./admin-activation-codes-panel";

export const metadata: Metadata = {
  title: "أكواد التفعيل",
};

export default function AdminActivationCodesPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-40 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-64 animate-pulse rounded-xl bg-muted/25" />
        </div>
      }
    >
      <AdminActivationCodesPanel />
    </Suspense>
  );
}
