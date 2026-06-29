import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminDeletedStudentsPanel } from "./admin-deleted-students-panel";

export const metadata: Metadata = {
  title: "الحسابات المحذوفة",
};

export default function AdminDeletedStudentsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="h-40 animate-pulse rounded-xl bg-muted/25" />
      }
    >
      <AdminDeletedStudentsPanel />
    </Suspense>
  );
}
