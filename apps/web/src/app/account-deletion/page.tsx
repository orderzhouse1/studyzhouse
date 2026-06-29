import type { Metadata } from "next";

import { AccountDeletionEmailTemplate } from "@/components/legal/account-deletion-email-template";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LegalSections } from "@/components/legal/legal-sections";
import { ACCOUNT_DELETION_SECTIONS } from "@/lib/legal-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: "حذف الحساب والبيانات | STUDYZHOUSE",
  },
  description:
    "اطلب حذف حسابك وبياناتك على منصة STUDYZHOUSE عبر البريد الإلكتروني. Account and Data Deletion for STUDYZHOUSE students.",
  alternates: {
    canonical: "https://studyzhouse.com/account-deletion",
  },
  openGraph: {
    title: "حذف الحساب والبيانات | STUDYZHOUSE",
    description:
      "كيفية طلب حذف حساب STUDYZHOUSE والبيانات المرتبطة به — Account and Data Deletion.",
    url: "https://studyzhouse.com/account-deletion",
  },
};

export default function AccountDeletionPage(): React.ReactElement {
  return (
    <LegalPageShell
      title="حذف الحساب والبيانات"
      description="اطلب حذف حسابك على منصة STUDYZHOUSE وبياناتك المرتبطة به عبر البريد الإلكتروني — دون الحاجة لتسجيل الدخول. Account and Data Deletion."
    >
      <div className="space-y-4">
        <LegalSections sections={ACCOUNT_DELETION_SECTIONS} />
        <AccountDeletionEmailTemplate />
      </div>
    </LegalPageShell>
  );
}
