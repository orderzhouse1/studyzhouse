import type { Metadata } from "next";

import { AdminActivationCodesPanel } from "@/components/admin/admin-activation-codes-panel";

export const metadata: Metadata = {
  title: "أكواد التفعيل",
};

export default function AdminActivationCodesPage(): React.ReactElement {
  return <AdminActivationCodesPanel />;
}
