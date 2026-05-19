import type { Metadata } from "next";

import { StudentPurchasesPanel } from "@/components/student/student-purchases-panel";

export const metadata: Metadata = {
  title: "مشترياتي",
};

export default function StudentPurchasesPage(): React.ReactElement {
  return <StudentPurchasesPanel />;
}
