import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "لوحة المدير الأعلى",
};

export default function SuperAdminHomePage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-8 px-6 py-12 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary">منطقة المدير الأعلى</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            تحكّم عام — مرحلة أولية
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            لاحقًا: المستخدمون، السجلات، والإعدادات الحسّاسة. الآن نؤكد صلاحيات
            الدور فقط.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-border/70 bg-gradient-to-l from-primary/5 via-card to-card p-8 shadow-sm">
        <p className="text-sm leading-relaxed text-muted-foreground">
          بطاقة بهوية هادئة — بدون تدرّجات صاخبة، وبمساحات واسعة كما نريد للمنتج
          النهائي.
        </p>
      </section>
    </div>
  );
}
