import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSections } from "@/components/legal/legal-sections";
import { TERMS_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: "الشروط والأحكام | منصة ستادي هاوس",
  },
  description:
    "شروط استخدام منصة ستادي هاوس للتعلم: الحسابات، الكورسات، الدفع اليدوي، أكواد التفعيل، والسلوك المقبول.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <LegalPageShell
      title="الشروط والأحكام"
      description="باستخدامك لمنصة ستادي هاوس فإنك توافق على هذه الشروط التي تنظّم حسابك، والكورسات، والدفع، وسلوكك على المنصة."
    >
      <LegalSections sections={TERMS_SECTIONS} />
    </LegalPageShell>
  );
}
