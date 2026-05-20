import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
};

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <AuthSplitLayout
      title="إعادة تعيين كلمة المرور"
      subtitle="سنرسل رمز تحقق إلى بريدك إن كان مسجّلًا لدينا."
    >
      <Suspense
        fallback={
          <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
            جارٍ التحميل…
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
