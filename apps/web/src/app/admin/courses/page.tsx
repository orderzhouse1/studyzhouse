import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { AdminCoursesPanel } from "./admin-courses-panel";

export const metadata: Metadata = {
  title: "إدارة الكورسات",
};

export default function AdminCoursesPage(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        eyebrow="لوحة الإدارة"
        title="الكورسات"
        description="مساحة عمل واسعة، مقروءة، وبعيدة عن الشعور العام للوحات الرمادية."
        actions={
          <>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-xl text-primary hover:bg-primary/10"
            >
              <Link href="/admin/categories">إدارة التصنيفات</Link>
            </Button>
            <LogoutButton />
          </>
        }
      />

      <AdminCoursesPanel />
    </div>
  );
}
