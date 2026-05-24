import { HelpCircle, KeyRound, Mail, User } from "lucide-react";
import Link from "next/link";

import { StudentAccountPageHeader } from "@/components/student/student-account-page-header";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    title: "كيف أفعّل كورس بكود؟",
    body: "من قائمة الحساب أو صفحة «تفعيل كورس»، أدخل كود التفعيل الذي استلمته من الإدارة. بعد التحقق، يُضاف الكورس إلى «كورساتي» مباشرة.",
    href: "/student/redeem",
    linkLabel: "انتقل لتفعيل كورس",
  },
  {
    title: "كيف أرسل طلب دفع عبر CliQ؟",
    body: "افتح صفحة الكورس المطلوب واضغط «شراء عبر كليك». أدخل مرجع التحويل والمبلغ حسب التعليمات. بعد موافقة الإدارة يُفعَّل الوصول.",
    href: "/student/explore",
    linkLabel: "استكشف الكورسات",
  },
  {
    title: "لماذا لا يظهر الكورس في كورساتي؟",
    body: "قد يكون الطلب قيد المراجعة، أو الكود غير صحيح، أو الحساب موقوفًا. راجع «مشترياتي» لمعرفة حالة كل طلب.",
    href: "/student/purchases",
    linkLabel: "عرض مشترياتي",
  },
  {
    title: "كيف أغيّر كلمة المرور؟",
    body: "استخدم رابط «تغيير كلمة المرور» في الإعدادات لإرسال رمز إعادة التعيين إلى بريدك.",
    href: "/forgot-password",
    linkLabel: "تغيير كلمة المرور",
  },
  {
    title: "كيف أعدّل ملفي الشخصي؟",
    body: "من «الملف الشخصي» يمكنك تحديث اسمك وتفضيلاتك التعليمية. البريد الإلكتروني للقراءة فقط حاليًا.",
    href: "/student/profile",
    linkLabel: "الملف الشخصي",
  },
  {
    title: "كيف أتواصل مع الإدارة؟",
    body: "راسلنا عبر البريد الرسمي للمنصة أو قنوات الدعم التي يشاركها فريق StudyHouse. اذكر بريد حسابك واسم الكورس لتسريع المساعدة.",
    href: "mailto:support@studyhouse.app",
    linkLabel: "مراسلة الدعم",
    external: true,
  },
] as const;

export function StudentHelpPanel(): React.ReactElement {
  return (
    <>
      <StudentAccountPageHeader
        eyebrow="مساعدة"
        title="مركز التعليمات"
        description="إجابات سريعة لأكثر الأسئلة شيوعًا."
      />
      <div className={cn("pb-16", STUDENT_CONTENT_PAD)}>
        <div className="mx-auto w-full max-w-2xl space-y-4 py-6 md:py-8">
          <div className="grid gap-3 sm:gap-4">
            {FAQ_ITEMS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/50 sm:p-5"
              >
                <h2 className="flex items-center gap-2 text-sm font-bold text-heading">
                  <HelpCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  {...("external" in item && item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.linkLabel}
                </Link>
              </article>
            ))}
          </div>
          <nav
            className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-center"
            aria-label="وثائق قانونية"
          >
            <p className="text-xs font-semibold text-heading">وثائق المنصة</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <Link
                href="/privacy-policy"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                الشروط والأحكام
              </Link>
              <Link
                href="/refund-policy"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                سياسة الاسترجاع
              </Link>
            </div>
          </nav>
          <p className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden />
              الملف الشخصي
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
              الأمان
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              الدعم
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
