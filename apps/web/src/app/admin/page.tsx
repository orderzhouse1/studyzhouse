import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

export default function AdminHomePage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-8 px-6 py-12 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary">منطقة الإدارة</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            مساحة عمل الإدارة — جاهزة للبناء التالي
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            لاحقًا: الكورسات، الطلاب، الأكواد، والمراجعة. الآن فقط هيكل الحماية
            والتوجيه.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-foreground">حالة النظام</p>
          <p className="mt-2 text-sm text-muted-foreground">
            المصادقة عبر API مع ملفات تعريف ارتباط آمنة.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-bl from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                إدارة الكورسات
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                قائمة ذكية، فلاتر، وإنشاء/تعديل بهوية RTL راقية — بدون لوحة رمادية
                جافة.
              </p>
            </div>
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </span>
          </div>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/admin/courses">الانتقال إلى الكورسات</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
