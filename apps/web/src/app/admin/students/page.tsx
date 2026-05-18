import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminStudentsPanel } from "./admin-students-panel";

export const metadata: Metadata = {
  title: "إدارة الطلاب",
};

export default function AdminStudentsPage(): React.ReactElement {
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
      <AdminStudentsPanel />
    </Suspense>
  );
}
