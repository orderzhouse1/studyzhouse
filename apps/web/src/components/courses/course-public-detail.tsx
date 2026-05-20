import { Suspense } from "react";
import {
  Check,
  Clock,
  Globe2,
  GraduationCap,
  Monitor,
  Sparkles,
  Tag,
  Video,
} from "lucide-react";
import Link from "next/link";

import { CourseStudentActions } from "@/components/courses/course-student-actions";
import { SameCategoryCoursesAsync } from "@/components/courses/same-category-courses-async";
import { SameCategoryCoursesSkeleton } from "@/components/courses/same-category-courses-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StudentHeader } from "@/components/layout/student-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_NAME_AR } from "@studyhouse/shared";
import { cn } from "@/lib/utils";

export type PublicCourseDetail = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  thumbnailUrl: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
  level: string;
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  category: null | { id: string; name: string; slug: string };
  lessonCount: number;
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدّم",
  ALL_LEVELS: "جميع المستويات",
};

function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "مرن";
  if (minutes < 60) return `${minutes} د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}

function priceLabel(course: PublicCourseDetail): string {
  if (course.pricingType === "FREE") return "مجاني";
  return `${course.priceAmount ?? "—"} ${course.currency}`;
}

function buildLearnOutcomes(course: PublicCourseDetail): string[] {
  const fromLines = course.description
    .split(/\n+/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter((l) => l.length > 12);

  if (fromLines.length >= 2) {
    return fromLines.slice(0, 6);
  }

  const items: string[] = [];
  if (course.shortDescription) {
    items.push(course.shortDescription);
  }
  items.push(
    `الوصول إلى ${course.lessonCount} درسًا منظّمًا داخل ${APP_NAME_AR}.`,
    "متابعة تقدّمك وإكمال الدروس بترتيب واضح.",
    "محتوى فيديو باللغة العربية يمكنك مشاهدته وفق جدولك.",
  );
  if (items.length < 4 && course.description.length > 20) {
    const snippet = course.description.replace(/\s+/g, " ").slice(0, 180);
    if (!items.some((i) => i.includes(snippet.slice(0, 40)))) {
      items.unshift(snippet + (course.description.length > 180 ? "…" : ""));
    }
  }
  return items.slice(0, 5);
}

function buildSkillTags(course: PublicCourseDetail): string[] {
  const tags: string[] = [];
  if (course.category) tags.push(course.category.name);
  tags.push(levelLabel(course.level));
  tags.push(course.pricingType === "FREE" ? "وصول مجاني" : "كورس مدفوع");
  tags.push("تعلّم ذاتي");
  return tags;
}

function buildToolTags(course: PublicCourseDetail): string[] {
  const tags = [APP_NAME_AR, "فيديو يوتيوب"];
  if (course.category?.name.includes("برمج")) {
    tags.push("محرّر متصفّح");
  }
  return tags;
}

const INFO_BAR_ACCENT_STYLE: React.CSSProperties = {
  color: "#ffffff",
  backgroundColor: "hsl(222, 47%, 14%)",
  backgroundImage: [
    "radial-gradient(circle at 100% 100%, hsl(24, 95%, 53%, 0.35) 0%, transparent 48%)",
    "linear-gradient(145deg, hsl(222, 47%, 13%) 0%, hsl(222, 47%, 20%) 52%, hsl(222, 47%, 15%) 100%)",
  ].join(", "),
};

function InfoBarCell({
  title,
  children,
  className,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent";
}): React.ReactElement {
  const accent = variant === "accent";

  return (
    <div
      style={accent ? INFO_BAR_ACCENT_STYLE : undefined}
      className={cn(
        "flex min-w-0 flex-col justify-center gap-1 border-border/80 px-4 py-3.5 md:px-5 md:py-4",
        "border-b last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0",
        accent && "course-info-accent-cell border-e-white/15 md:rounded-e-[1.35rem]",
        className,
      )}
    >
      <p
        className={cn(
          "text-sm font-bold",
          accent ? "text-white" : "text-heading",
        )}
      >
        {title}
      </p>
      <div
        className={cn(
          "text-xs leading-relaxed",
          accent
            ? "text-white/85 [&_.font-semibold]:text-white [&_svg]:text-[hsl(24,95%,53%)]"
            : "text-muted-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function CoursePublicDetail({
  course,
  variant = "guest",
  catalogBackHref,
  hideShellHeader = false,
}: {
  course: PublicCourseDetail;
  variant?: "guest" | "student";
  catalogBackHref?: string;
  /** عند العرض داخل StudentShell لا نكرّر الهيدر */
  hideShellHeader?: boolean;
}): React.ReactElement {
  const outcomes = buildLearnOutcomes(course);
  const skills = buildSkillTags(course);
  const tools = buildToolTags(course);
  const duration = formatDuration(course.estimatedDurationMinutes);
  const price = priceLabel(course);
  const isStudent = variant === "student";
  const backHref = catalogBackHref ?? (isStudent ? "/student/explore" : "/courses");
  const categoryHref = course.category
    ? isStudent
      ? `/student/explore?categorySlug=${encodeURIComponent(course.category.slug)}`
      : `/courses?categorySlug=${encodeURIComponent(course.category.slug)}`
    : isStudent
      ? "/student/explore"
      : "/courses";
  const ctaLabel =
    course.pricingType === "FREE" ? "ابدأ التعلّم مجاناً" : "إنشاء حساب للوصول";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {isStudent && !hideShellHeader ? (
        <StudentHeader />
      ) : !isStudent ? (
        <SiteHeader coursesActive />
      ) : null}

      <section className="relative overflow-hidden bg-secondary/45 pb-16 pt-5 md:pb-20 md:pt-8">
        <div
          className="pointer-events-none absolute -start-16 top-6 h-52 w-52 rounded-full border-[12px] border-primary/15 opacity-65"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute start-20 top-24 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-10 bottom-0 h-44 w-44 rounded-full border-[9px] border-sky-200/60"
          aria-hidden
        />
        {course.thumbnailUrl ? (
          <div
            className="pointer-events-none absolute end-0 top-0 hidden h-full w-[42%] max-w-xl opacity-[0.14] lg:block"
            aria-hidden
          >
            <img
              src={course.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </div>
        ) : null}

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl">
            {course.category ? (
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                تصنيف:{" "}
                <Link
                  href={categoryHref}
                  className="text-heading underline-offset-2 hover:underline"
                >
                  {course.category.name}
                </Link>
              </p>
            ) : null}

            <h1 className="text-balance text-3xl font-bold tracking-tight text-heading md:text-4xl md:leading-tight">
              {course.title}
            </h1>

            {course.shortDescription ? (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {course.shortDescription}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant={course.pricingType === "FREE" ? "free" : "paid"}>
                {price}
              </Badge>
              <Badge variant="secondary">{levelLabel(course.level)}</Badge>
              {course.lessonCount > 0 ? (
                <Badge variant="outline">{course.lessonCount} درس</Badge>
              ) : null}
            </div>

            {isStudent ? (
              <div className="mt-6">
                <CourseStudentActions course={course} layout="hero" />
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="min-w-[11rem] shadow-brand">
                    <Link href="/signup">{ctaLabel}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-xl">
                    <Link href="/login">لديّ حساب — تسجيل الدخول</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {course.pricingType === "FREE"
                    ? "بعد إنشاء الحساب يمكنك تفعيل الكورس من لوحة الاستكشاف والبدء فوراً."
                    : "الكورسات المدفوعة تتطلّب تفعيلاً عبر رمز أو طلب دفع بعد التسجيل."}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto -mb-6 mt-8 w-full max-w-6xl px-4 sm:px-6 md:-mb-8 md:mt-10 md:px-8">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card ring-1 ring-border/50 md:rounded-3xl">
            <div className="grid md:grid-cols-5">
              <InfoBarCell title="محتوى الكورس" variant="accent">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Video className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {course.lessonCount} درس فيديو
                </span>
                <span className="mt-0.5 block">
                  منهج منظّم بأقسام ودروس قابلة للمتابعة.
                </span>
              </InfoBarCell>

              <InfoBarCell title="نوع الوصول">
                <span className="font-semibold text-heading">{price}</span>
                <span className="mt-0.5 block">
                  {course.pricingType === "FREE"
                    ? "متاح للتسجيل المباشر بعد إنشاء حساب."
                    : "يتطلّب تفعيلاً بعد الموافقة أو رمز تفعيل."}
                </span>
              </InfoBarCell>

              <InfoBarCell title="المستوى">
                <span className="font-semibold text-heading">
                  {levelLabel(course.level)}
                </span>
                <span className="mt-0.5 block">
                  مناسب لمسارك الحالي داخل المنصّة.
                </span>
              </InfoBarCell>

              <InfoBarCell title="المدة التقديرية">
                <span className="flex items-center gap-1.5 font-semibold text-heading">
                  <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {duration}
                </span>
                <span className="mt-0.5 block">تعلّم وفق ما يناسب جدولك.</span>
              </InfoBarCell>

              <InfoBarCell title="تجربة تعلّم">
                <span className="flex items-center gap-1.5 font-semibold text-heading">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  تقدّم واضح
                </span>
                <span className="mt-0.5 block">
                  تتبّع إكمال الدروس من لوحة الطالب.
                </span>
              </InfoBarCell>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl space-y-14 px-4 py-11 sm:px-6 md:px-8 md:py-14">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-heading md:text-2xl">
            ما ستتعلّمه
          </h2>
          <ul className="space-y-3">
            {outcomes.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-foreground/90">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-heading md:text-2xl">
            ما ستحصل عليه
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground ring-1 ring-sky-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-heading md:text-2xl">
            أدوات ومنصّة التعلّم
          </h2>
          <div className="flex flex-wrap gap-2">
            {tools.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm"
              >
                <Tag className="h-3 w-3 text-primary" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-heading md:text-2xl">
            تفاصيل يجب معرفتها
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-heading">تتبّع التقدّم</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  سجّل إكمال كل درس وشاهد نسبة تقدّمك في الكورس من لوحة الطالب.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Globe2 className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-heading">يُقدَّم بالعربية</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  واجهة المنصّة والمحتوى التعليمي موجّهان للمتعلّم العربي.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-heading">
                <Monitor className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-heading">من المتصفّح مباشرة</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  لا حاجة لتثبيت برامج — تعلّم من الحاسوب أو الجهاز اللوحي.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-between gap-4 border-t border-border/80 pt-8">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={backHref}>← العودة للكتالوج</Link>
          </Button>
          {!isStudent ? (
            <Button asChild variant="cyan" className="rounded-xl">
              <Link href="/login?next=/student/explore">تسجيل الدخول كطالب</Link>
            </Button>
          ) : null}
        </div>
      </main>

      {course.category ? (
        <Suspense fallback={<SameCategoryCoursesSkeleton />}>
          <SameCategoryCoursesAsync course={course} isStudent={isStudent} />
        </Suspense>
      ) : null}

      {!isStudent ? <SiteFooter className="mt-2" /> : null}
    </div>
  );
}
