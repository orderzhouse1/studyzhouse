import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import { AdminCategoriesPanel } from "./admin-categories-panel";

export const metadata: Metadata = {
  title: "إدارة التصنيفات",
};

export default function AdminCategoriesPage(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PageHeader
        eyebrow="لوحة الإدارة"
        title="التصنيفات"
        description="تنظيم أنيق للمحتوى — إنشاء، تعديل، وأرشفة، مع شارات واضحة للحالة."
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/admin/courses">← العودة إلى الكورسات</Link>
            </Button>
            <LogoutButton />
          </>
        }
      />

      <AdminCategoriesPanel />
    </div>
  );
}
