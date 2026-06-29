import { Mail } from "lucide-react";

import { LEGAL_SUPPORT_EMAIL } from "@/lib/legal-content";

const EMAIL_SUBJECT = "طلب حذف حساب STUDYZHOUSE";

const EMAIL_BODY = `مرحباً فريق الدعم،

أطلب حذف حسابي وبياناتي المرتبطة به على منصة STUDYZHOUSE.

البريد الإلكتروني المرتبط بالحساب: [أدخل بريدك]
الاسم (اختياري): [أدخل اسمك]
سبب الطلب (اختياري): [اذكر السبب إن رغبت]

أؤكد أنني صاحب هذا الحساب وأرسل الطلب من البريد المرتبط به.

مع الشكر،
[اسمك]`;

function buildMailtoHref(): string {
  const params = new URLSearchParams({
    subject: EMAIL_SUBJECT,
    body: EMAIL_BODY,
  });
  return `mailto:${LEGAL_SUPPORT_EMAIL}?${params.toString()}`;
}

export function AccountDeletionEmailTemplate(): React.ReactElement {
  return (
    <section
      id="email-template"
      className="scroll-mt-24 rounded-2xl border border-border/70 bg-card p-5 shadow-sm ring-1 ring-border/40 sm:p-6"
      aria-labelledby="email-template-heading"
    >
      <h2
        id="email-template-heading"
        className="text-base font-bold text-[hsl(222_47%_18%)] sm:text-lg"
      >
        نموذج طلب بالبريد
      </h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        يمكنك نسخ النموذج أدناه أو فتح بريدك مباشرة عبر الزر.{" "}
        <strong className="font-semibold text-foreground">
          أرسل الطلب من البريد الإلكتروني المرتبط بحسابك على STUDYZHOUSE.
        </strong>
      </p>
      <pre
        className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-start text-xs leading-relaxed text-foreground sm:text-sm"
        dir="rtl"
      >
        {`موضوع: ${EMAIL_SUBJECT}

${EMAIL_BODY}`}
      </pre>
      <a
        href={buildMailtoHref()}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[hsl(var(--primary-hover))]"
      >
        <Mail className="h-4 w-4" aria-hidden />
        إرسال الطلب إلى {LEGAL_SUPPORT_EMAIL}
      </a>
    </section>
  );
}
