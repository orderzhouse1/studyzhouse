import type { Metadata } from "next";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "إنشاء حساب",
};

export default function SignupPage(): React.ReactElement {
  return (
    <AuthSplitLayout
      title="أنشئ حسابك"
      subtitle="انضم كطالب واستكشف الكورسات — الوصول للكورسات المدفوعة عبر كود أو CliQ."
    >
      <SignupForm />
    </AuthSplitLayout>
  );
}
