import type { Metadata } from "next";

import { SuperAdminSettingsPanel } from "@/components/super-admin/super-admin-settings-panel";

export const metadata: Metadata = {
  title: "الإعدادات — المدير الأعلى",
};

export default function SuperAdminSettingsPage(): React.ReactElement {
  return <SuperAdminSettingsPanel />;
}
