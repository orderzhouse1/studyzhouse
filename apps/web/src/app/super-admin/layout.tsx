import { AdminWorkspaceShell } from "@/components/admin/workspace/admin-workspace-shell";

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="h-dvh overflow-hidden">
      <AdminWorkspaceShell role="super-admin">{children}</AdminWorkspaceShell>
    </div>
  );
}
