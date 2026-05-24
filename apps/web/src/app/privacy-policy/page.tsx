import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSections } from "@/components/legal/legal-sections";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: "سياسة الخصوصية | منصة ستادي هاوس",
  },
  description:
    "تعرف على كيفية جمع منصة ستادي هاوس لبياناتك واستخدامها وحمايتها عند التعلم عبر الإنترنت.",
};

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <LegalPageShell
      title="سياسة الخصوصية"
      description="نوضّح هنا نوع البيانات التي نجمعها عند استخدامك للمنصة، ولماذا نحتاجها، وكيف نحمي خصوصيتك."
    >
      <LegalSections sections={PRIVACY_POLICY_SECTIONS} />
    </LegalPageShell>
  );
}
