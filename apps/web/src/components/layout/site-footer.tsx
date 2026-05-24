import {
  ArrowUpLeft,
  GraduationCap,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { SiteLogo } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { APP_NAME_AR } from "@studyhouse/shared";
import { LEGAL_SUPPORT_EMAIL } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

type FooterLink = { label: string; href: string };

const PLATFORM_LINKS: FooterLink[] = [
  { label: "الرئيسية", href: "/" },
  { label: "استكشف الكورسات", href: "/courses" },
];

const LEARNER_LINKS: FooterLink[] = [
  { label: "إنشاء حساب", href: "/signup" },
  { label: "تسجيل الدخول", href: "/login" },
  { label: "لوحة التعلّم", href: "/student/explore" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
  { label: "الشروط والأحكام", href: "/terms" },
  { label: "سياسة الاسترجاع", href: "/refund-policy" },
];

function FooterNavColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}): React.ReactElement {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/75 transition hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({
  showFeaturedLink = false,
  showFaqLink = false,
  className,
}: {
  showFeaturedLink?: boolean;
  showFaqLink?: boolean;
  className?: string;
}): React.ReactElement {
  const year = new Date().getFullYear();

  const platformLinks = [
    ...PLATFORM_LINKS,
    ...(showFeaturedLink
      ? [{ label: "مختارات الكتالوج", href: "/#featured" }]
      : []),
    ...(showFaqLink
      ? [{ label: "الأسئلة الشائعة", href: "/#home-faq-heading" }]
      : []),
  ];

  return (
    <footer
      id="site-footer"
      className={cn(
        "relative scroll-mt-20 overflow-hidden border-t border-white/10",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-[linear-gradient(90deg,hsl(222_47%_22%_/_0.4)_0%,hsl(24_95%_53%_/_0.95)_50%,hsl(222_47%_22%_/_0.4)_100%)]"
        aria-hidden
      />

      <div
        className={cn(
          "relative text-white",
          "bg-[linear-gradient(165deg,hsl(222_47%_9%)_0%,hsl(222_47%_14%)_42%,hsl(265_38%_18%)_78%,hsl(222_47%_11%)_100%)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_100%_0%,hsl(24_95%_53%_/_0.32)_0%,hsl(24_95%_53%_/_0.1)_40%,transparent_68%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-20 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-primary/40 blur-[88px] sm:-top-24 sm:h-96 sm:w-96 sm:blur-[110px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-16 bottom-0 h-48 w-48 rounded-full bg-[hsl(265_55%_45%_/_0.18)] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute end-8 top-12 hidden h-28 w-28 rounded-full border-[10px] border-white/10 opacity-50 lg:block"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[min(100%,88rem)] px-4 py-12 sm:px-6 md:px-8 md:py-14 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.35fr_1fr_1fr_1fr_1.1fr] xl:gap-8">
            <div className="space-y-4">
              <SiteLogo
                href="/"
                imageClassName="h-11 max-w-[12.5rem] brightness-110 sm:h-12"
              />
              <p className="max-w-md text-pretty text-sm leading-relaxed text-white/75">
                منصّة تعليمية عربية تجمع بين كورسات منظّمة، تتبّع تقدّم حقيقي،
                وتجربة واجهة نظيفة — للمتعلّم الذي يريد مسارًا واضحًا دون تعقيد.
              </p>
              <ul className="flex flex-wrap gap-4 text-xs text-white/60">
                <li className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" aria-hidden />
                  مسارات تعليمية
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  تقدّم واضح
                </li>
              </ul>
            </div>

            <FooterNavColumn title="المنصّة" links={platformLinks} />
            <FooterNavColumn title="للمتعلّم" links={LEARNER_LINKS} />
            <FooterNavColumn title="قانوني" links={LEGAL_LINKS} />

            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary">
                  ابدأ اليوم
                </p>
                <p className="mt-2 text-balance text-base font-bold leading-snug text-white">
                  انضم وابدأ أول كورس في دقائق
                </p>
                <p className="mt-2 text-pretty text-xs leading-relaxed text-white/70">
                  سجّل حسابًا مجانيًا، استكشف الكتالوج، وفعّل الكورسات المناسبة
                  لمسارك — مجانية أو مدفوعة حسب اختيارك.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="h-10 rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_hsl(24_95%_53%_/_0.5)] hover:bg-[hsl(var(--primary-hover))]"
                >
                  <Link href="/signup">إنشاء حساب</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/courses">تصفّح الكورسات</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between md:mt-12">
            <p className="text-xs text-white/55 sm:text-sm">
              © {year} {APP_NAME_AR}. جميع الحقوق محفوظة.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <a
                href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {LEGAL_SUPPORT_EMAIL}
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-white/70 transition hover:text-primary"
              >
                العودة للأعلى
                <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

