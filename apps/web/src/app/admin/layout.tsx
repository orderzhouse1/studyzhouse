import { AdminWorkspaceShell } from "@/components/admin/workspace/admin-workspace-shell";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="h-dvh overflow-hidden">
      <AdminWorkspaceShell role="admin">{children}</AdminWorkspaceShell>
    </div>
  );
}
