"use client";

import { KeyRound, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Button } from "@/components/ui/button";
import { fetchStudentProfilePage } from "@/lib/student-profile-api";
import { cn } from "@/lib/utils";
import type { StudentAccount } from "@studyhouse/shared";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  PENDING: "قيد التفعيل",
};

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/50 sm:p-5">
      <h2 className="text-sm font-bold text-heading">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function DisabledToggle({ label }: { label: string }): React.ReactElement {
  return (
    <label className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 opacity-70">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[0.65rem] font-medium text-muted-foreground">قريبًا</span>
        <input type="checkbox" disabled className="h-4 w-4 rounded" />
      </span>
    </label>
  );
}

export function StudentSettingsPanel(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<StudentAccount | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const page = await fetchStudentProfilePage();
      setAccount(page.account);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <StudentAccountPageHeader
        eyebrow="حسابي"
        title="الإعدادات"
        description="إدارة أمان حسابك وتفضيلاتك."
      />
      <div className={cn("pb-16", STUDENT_CONTENT_PAD)}>
        <div className="mx-auto w-full max-w-2xl space-y-4 py-6 md:py-8">
          {loading ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : account ? (
            <>
              <SettingsSection title="معلومات الحساب">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-heading">البريد الإلكتروني</p>
                    <p dir="ltr" className="truncate text-start text-muted-foreground">
                      {account.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تغيير البريد غير متاح حاليًا.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-heading">حالة الحساب:</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {STATUS_LABELS[account.status] ?? account.status}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-heading">طرق تسجيل الدخول</p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      كلمة مرور
                    </li>
                    {account.hasGoogleLogin ? (
                      <li className="flex items-center gap-2">
                        <span aria-hidden>G</span>
                        حساب Google مرتبط
                      </li>
                    ) : null}
                  </ul>
                </div>
              </SettingsSection>

              <SettingsSection title="الأمان">
                <p className="text-sm text-muted-foreground">
                  لتغيير كلمة المرور، استخدم رابط إعادة التعيين عبر بريدك.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forgot-password">
                    <KeyRound className="h-4 w-4" aria-hidden />
                    تغيير كلمة المرور
                  </Link>
                </Button>
              </SettingsSection>

              <SettingsSection title="الخصوصية">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  بيانات ملفك التعليمي (الاهتمامات، المستوى، الأهداف) تُستخدم لتخصيص
                  اقتراحات الكورسات داخل المنصة فقط. لا تُعرض هذه المعلومات للطلاب
                  الآخرين أو للعامة.
                </p>
              </SettingsSection>

              <SettingsSection title="التنبيهات">
                <DisabledToggle label="إشعارات البريد الإلكتروني" />
                <DisabledToggle label="تذكيرات الدراسة" />
                <DisabledToggle label="تحديثات الكورسات" />
              </SettingsSection>

              <SettingsSection title="حذف الحساب">
                <p className="text-sm text-muted-foreground">
                  لإغلاق حسابك نهائيًا، تواصل مع الإدارة. لا يتوفر حذف ذاتي حاليًا.
                </p>
              </SettingsSection>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
