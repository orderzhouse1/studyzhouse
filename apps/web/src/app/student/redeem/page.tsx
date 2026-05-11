import type { Metadata } from "next";

import { StudentRedeemPanel } from "@/components/student/student-redeem-panel";

export const metadata: Metadata = {
  title: "تفعيل كورس",
};

export default function StudentRedeemPage(): React.ReactElement {
  return <StudentRedeemPanel />;
}
