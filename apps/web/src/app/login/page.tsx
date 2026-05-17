import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage(): React.ReactElement {
  return (
    <AuthSplitLayout
      title="مرحبًا بعودتك"
      subtitle="جلسة آمنة عبر ملفات تعريف الارتباط HttpOnly — بدون تخزين الرموز في المتصفح."
    >
      <Suspense
        fallback={
          <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
            جارٍ تحميل النموذج…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
