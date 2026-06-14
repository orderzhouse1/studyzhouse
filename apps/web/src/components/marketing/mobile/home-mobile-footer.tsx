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
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
  { label: "الشروط والأحكام", href: "/terms" },
  { label: "سياسة الاسترجاع", href: "/refund-policy" },
];

function LinkChip({ href, label }: FooterLink): React.ReactElement {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 transition active:scale-95"
    >
      {label}
    </Link>
  );
}

/**
 * فوتر مبسّط للجوال — بطاقات وشرائح بدل شبكة سطح المكتب.
 */
export function HomeMobileFooter({
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
      ? [{ label: "مختارات", href: "/#featured" }]
      : []),
    ...(showFaqLink
      ? [{ label: "الأسئلة الشائعة", href: "/#home-faq-heading" }]
      : []),
  ];

  return (
    <footer
      id="site-footer"
      className={cn(
        "relative scroll-mt-20 overflow-hidden rounded-t-[2rem]",
        className,
      )}
    >
      <div className="relative bg-[linear-gradient(165deg,hsl(222_47%_9%)_0%,hsl(222_47%_14%)_55%,hsl(265_38%_18%)_100%)] px-4 py-8 text-white">
        <div
          className="pointer-events-none absolute -end-10 top-0 h-32 w-32 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />

        <SiteLogo
          href="/"
          imageClassName="h-10 max-w-[10rem] brightness-110"
        />
        <p className="mt-3 max-w-sm text-pretty text-xs leading-relaxed text-white/70">
          منصّة تعليمية عربية تجمع بين كورسات منظّمة وتتبّع تقدّم حقيقي.
        </p>

        <ul className="mt-3 flex flex-wrap gap-3 text-[0.6875rem] text-white/55">
          <li className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-primary" aria-hidden />
            مسارات تعليمية
          </li>
          <li className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            تقدّم واضح
          </li>
        </ul>

        <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.05] p-4">
          <p className="text-xs font-semibold text-primary">ابدأ اليوم</p>
          <p className="mt-1 text-sm font-bold">انضم وابدأ أول كورس في دقائق</p>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              asChild
              className="h-10 rounded-full bg-primary text-primary-foreground shadow-brand"
            >
              <Link href="/signup">إنشاء حساب</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/courses">تصفّح الكورسات</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-xs font-bold text-white/90">روابط سريعة</p>
          <div className="home-mobile-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            {platformLinks.map((link) => (
              <LinkChip key={link.href + link.label} {...link} />
            ))}
            {LEARNER_LINKS.map((link) => (
              <LinkChip key={link.href + link.label} {...link} />
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold text-white/90">قانوني</p>
          <div className="flex flex-wrap gap-2">
            {LEGAL_LINKS.map((link) => (
              <LinkChip key={link.href + link.label} {...link} />
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <p className="text-[0.6875rem] text-white/50">
            © {year} {APP_NAME_AR}. جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <a
              href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1 text-white/65"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {LEGAL_SUPPORT_EMAIL}
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/65"
            >
              العودة للأعلى
              <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
