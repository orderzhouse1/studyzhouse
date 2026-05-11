import type { Metadata } from "next";

import { SuperAdminAdminNewForm } from "@/components/super-admin/super-admin-admin-new-form";

export const metadata: Metadata = {
  title: "أدمن جديد — المدير الأعلى",
};

export default function SuperAdminAdminNewPage(): React.ReactElement {
  return <SuperAdminAdminNewForm />;
}
