"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STUDENT_CONTENT_PAD =
  "px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20";

const HERO_GRADIENT =
  "bg-[linear-gradient(118deg,hsl(222_47%_10%)_0%,hsl(222_47%_17%)_38%,hsl(265_38%_24%)_72%,hsl(222_47%_14%)_100%)]";

/** كحلي غالب مع لمسة برتقالية خفيفة — للبروفايل في الهيدر */
export const STUDENT_AVATAR_GRADIENT_CLASS =
  "bg-[radial-gradient(circle_at_88%_78%,hsl(24_95%_53%_/_0.32)_0%,transparent_38%),linear-gradient(145deg,hsl(222_47%_11%)_0%,hsl(222_47%_17%)_62%,hsl(222_47%_13%)_100%)]";

export function StudentDashboardHero({
  eyebrow,
  title,
  description,
  stats,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  stats: Array<{
    label: string;
    value: string | number;
    icon: React.ElementType;
  }>;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b-[3px] border-primary/45 text-white",
        HERO_GRADIENT,
        "shadow-[0_16px_40px_-22px_hsl(222_47%_10%_/_0.5)]",
      )}
      aria-label={typeof title === "string" ? title : eyebrow}
    >
      <HeroBlurOrb />
      <HeroBlurOrbEnd />

      <div className={cn("relative py-5 sm:py-6 md:py-7", STUDENT_CONTENT_PAD)}>
        <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-balance text-2xl font-bold leading-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-sm">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 sm:gap-2.5">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-w-[6.75rem] items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-sm sm:min-w-[7rem] sm:px-3"
            >
              <Icon
                className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4"
                aria-hidden
              />
              <div>
                <p className="text-[10px] text-white/70">{label}</p>
                <p className="text-base font-bold tabular-nums leading-none sm:text-lg">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}

function HeroBlurOrb(): React.ReactElement {
  return (
    <div
      className="pointer-events-none absolute -start-16 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl"
      aria-hidden
    />
  );
}

function HeroBlurOrbEnd(): React.ReactElement {
  return (
    <div
      className="pointer-events-none absolute -bottom-20 end-0 h-40 w-40 rounded-full bg-[hsl(265_55%_40%_/_0.2)] blur-3xl"
      aria-hidden
    />
  );
}

export type MyCourseRow = {
  kind?: "enrolled" | "pending_payment";
  paymentRequestId?: string;
  enrollmentId: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedLesson: null | { id: string; title: string };
  course: {
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    category: null | { name: string };
  };
};

function CourseThumb({
  thumbnailUrl,
  progressPercent,
  pending,
}: {
  thumbnailUrl: string | null;
  progressPercent?: number;
  pending?: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-white/10",
        pending
          ? "bg-gradient-to-br from-[hsl(222_47%_14%)] to-amber-900/30"
          : "bg-gradient-to-br from-[hsl(222_47%_14%)] to-primary/25",
      )}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className={cn(
            "h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]",
            pending && "opacity-90",
          )}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <BookOpen
            className={cn(
              "h-6 w-6",
              pending ? "text-amber-200/50" : "text-primary/45",
            )}
            aria-hidden
          />
        </div>
      )}
      {typeof progressPercent === "number" && !pending ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-heading/85 to-transparent px-1 pb-1 pt-3 text-center text-[0.5625rem] font-semibold text-white">
          {progressPercent}%
        </span>
      ) : null}
    </div>
  );
}

export function MyCourseCard({
  row,
  layout = "grid",
}: {
  row: MyCourseRow;
  layout?: "grid" | "carousel";
}): React.ReactElement {
  const widthClass =
    layout === "carousel"
      ? "w-[min(100%,16.75rem)] shrink-0 sm:w-[16.75rem]"
      : "w-full";
  const isPending = row.kind === "pending_payment";

  if (isPending) {
    return (
      <div
        className={cn(
          "group flex gap-2.5 rounded-xl border border-amber-200/80 bg-card p-2.5 shadow-sm ring-1 ring-amber-100/50",
          widthClass,
        )}
      >
        <CourseThumb thumbnailUrl={row.course.thumbnailUrl} pending />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <Badge variant="warning" className="w-fit text-[0.5625rem]">
            انتظار المراجعة
          </Badge>
          <p className="truncate text-[0.625rem] font-medium text-primary">
            {row.course.category?.name ?? "كورسك"}
          </p>
          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-heading">
            {row.course.title}
          </h3>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-0.5 h-7 w-full rounded-lg border-amber-300/80 bg-amber-50/80 px-2 text-[0.625rem] text-amber-950 hover:bg-amber-50"
          >
            <Link href={`/student/courses/${row.course.slug}`}>
              عرض التفاصيل
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const href = row.lastAccessedLesson
    ? `/learn/${row.course.slug}?lessonId=${row.lastAccessedLesson.id}`
    : `/learn/${row.course.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex gap-2.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-sm ring-1 ring-border/40 transition hover:border-primary/30 hover:shadow-md",
        widthClass,
      )}
    >
      <CourseThumb
        thumbnailUrl={row.course.thumbnailUrl}
        progressPercent={row.progressPercent}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p className="truncate text-[0.625rem] font-semibold text-primary">
          {row.course.category?.name ?? "كورسك"}
        </p>
        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-heading group-hover:text-primary">
          {row.course.title}
        </h3>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${row.progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[0.625rem] text-muted-foreground">
          <span className="tabular-nums">
            {row.completedLessons}/{row.totalLessons} درس
          </span>
          <span className="inline-flex shrink-0 items-center font-semibold text-primary">
            متابعة
            <ArrowLeft className="ms-1 h-3 w-3" aria-hidden />
          </span>
        </div>
        {row.lastAccessedLesson ? (
          <p className="truncate text-[0.5625rem] text-muted-foreground/90">
            {row.lastAccessedLesson.title}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function MyCoursesSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-heading md:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
