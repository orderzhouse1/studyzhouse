import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSections } from "@/components/legal/legal-sections";
import { REFUND_POLICY_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: "سياسة الاسترجاع | منصة ستادي هاوس",
  },
  description:
    "سياسة الاسترجاع في ستادي هاوس للدفع اليدوي عبر CliQ وأكواد التفعيل — الشروط، الحالات، وآلية التواصل مع الإدارة.",
};

export default function RefundPolicyPage(): React.ReactElement {
  return (
    <LegalPageShell
      title="سياسة الاسترجاع"
      description="بما أن الدفع والتفعيل يتمّان يدويًا، توضّح هذه الصفحة متى يمكن طلب مراجعة أو استرجاع وكيف تتواصل مع الإدارة."
    >
      <LegalSections sections={REFUND_POLICY_SECTIONS} />
    </LegalPageShell>
  );
}
