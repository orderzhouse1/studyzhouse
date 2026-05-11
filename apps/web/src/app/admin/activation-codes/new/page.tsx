import type { Metadata } from "next";

import { AdminActivationCodeNewForm } from "@/components/admin/admin-activation-code-new-form";

export const metadata: Metadata = {
  title: "كود تفعيل جديد",
};

export default function AdminActivationCodeNewPage(): React.ReactElement {
  return <AdminActivationCodeNewForm />;
}
