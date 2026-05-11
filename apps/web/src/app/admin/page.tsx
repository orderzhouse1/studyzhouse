import type { Metadata } from "next";
import { FolderTree, GraduationCap, Shield, Users } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "لوحة الإدارة",
};

export default function AdminHomePage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-8">
      <PageHeader
        eyebrow="منطقة الإدارة"
        title="مساحة عمل الإدارة"
        description="تهيئة بصرية متناغمة مع هوية المنصة — جاهزة للكورسات والتصنيفات دون مظهر لوحة رمادية جافّة."
        actions={<LogoutButton />}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-bold text-heading">حالة النظام</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                المصادقة عبر API مع ملفات تعريف ارتباط آمنة.
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm ring-1 ring-sky-100">
              <Shield className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-bl from-primary/12 via-card to-card p-5 shadow-float ring-1 ring-primary/15">
          <div className="pointer-events-none absolute -end-8 top-0 h-24 w-24 rounded-full bg-brand-purple/80 blur-2xl" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-bold text-heading">إدارة الكورسات</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  قائمة ذكية، فلاتر، وبناء المحتوى — بهوية RTL راقية.
                </p>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <Button asChild className="w-fit shadow-brand">
              <Link href="/admin/courses">الانتقال إلى الكورسات</Link>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-secondary/80 bg-gradient-to-bl from-secondary/50 via-card to-card p-5 shadow-card ring-1 ring-secondary/70 md:col-span-2 lg:col-span-1">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-bold text-heading">تصنيفات المحتوى</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  أنشئ وأدر التصنيفات التي تظهر في الكتالوج العام والنماذج.
                </p>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground ring-1 ring-border/60">
                <FolderTree className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <Button asChild variant="cyan" className="w-fit">
              <Link href="/admin/categories">إدارة التصنيفات</Link>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card to-card p-5 shadow-card ring-1 ring-brand-purple/20 md:col-span-2 lg:col-span-1">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-bold text-heading">الطلاب والتسجيلات</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  إنشاء حسابات طلاب، التسجيل اليدوي في الكورسات، ومتابعة التقدّم.
                </p>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple/20 text-brand-purple ring-1 ring-brand-purple/25">
                <Users className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <Button asChild variant="outline" className="w-fit border-brand-purple/30 bg-card hover:bg-brand-purple/10">
              <Link href="/admin/students">إدارة الطلاب</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
