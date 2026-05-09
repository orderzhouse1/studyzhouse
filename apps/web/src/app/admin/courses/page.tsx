import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";

import { AdminCoursesPanel } from "./admin-courses-panel";

export const metadata: Metadata = {
  title: "إدارة الكورسات",
};

export default function AdminCoursesPage(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-12 md:px-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary">لوحة الإدارة</p>
          <h1 className="text-3xl font-semibold tracking-tight">الكورسات</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            مساحة عمل واسعة، مقروءة، وبعيدة عن الشعور العام للوحات الرمادية.
          </p>
        </div>
        <LogoutButton />
      </header>

      <AdminCoursesPanel />
    </div>
  );
}
