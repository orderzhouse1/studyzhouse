import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME_AR } from "@studyhouse/shared";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage(): React.ReactElement {
  return (
    <div className="relative min-h-screen">
      <div
        className="hero-mesh noise-soft absolute inset-0 -z-10"
        aria-hidden
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {APP_NAME_AR}
        </Link>
        <span className="text-xs text-muted-foreground">
          نسخة احترافية — هوية عربية RTL
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 pb-16 pt-10 md:px-8 md:pt-14">
        <div className="space-y-3 text-center md:text-right">
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            مرحبًا بعودتك
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            جلسة آمنة عبر ملفات تعريف الارتباط HttpOnly — بدون تخزين الرموز في
            المتصفح.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
              جارٍ تحميل النموذج…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
