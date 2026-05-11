import type { Metadata } from "next";

import { SuperAdminAdminsPanel } from "@/components/super-admin/super-admin-admins-panel";

export const metadata: Metadata = {
  title: "الأدمنز — المدير الأعلى",
};

export default function SuperAdminAdminsPage(): React.ReactElement {
  return <SuperAdminAdminsPanel />;
}
