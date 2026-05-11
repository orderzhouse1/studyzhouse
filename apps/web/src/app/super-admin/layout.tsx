import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
