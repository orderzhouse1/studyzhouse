import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentPaymentsPanel } from "@/components/student/student-payments-panel";

export const metadata: Metadata = {
  title: "مدفوعاتي",
};

export default function StudentPaymentsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">جاري التحميل…</p>
        </div>
      }
    >
      <StudentPaymentsPanel />
    </Suspense>
  );
}
