import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "لوحة الطالب",
};

export default function StudentHomePage(): React.ReactElement {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-8 px-6 py-12 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary">منطقة الطالب</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            مرحبًا — هذه لوحة مبدئية
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            لاحقًا ستظهر هنا الدروس والتقدّم والكورسات. الآن نثبت الحماية والتوجيه
            فقط.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="h-40 rounded-xl bg-muted/40 ring-1 ring-border/60" />
        <p className="mt-4 text-sm text-muted-foreground">
          مساحة محجوزة للقادم — بتصميم نظيف وبلا ازدحام.
        </p>
      </section>
    </div>
  );
}
