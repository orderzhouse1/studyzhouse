"use client";

import { StudentHeader } from "@/components/layout/student-header";

export function StudentShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-secondary/30 via-background to-primary/5">
      <StudentHeader />
      <main className="w-full">{children}</main>
    </div>
  );
}
