"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import {
  MyCourseCard,
  STUDENT_CONTENT_PAD,
} from "@/components/student/student-dashboard-ui";
import { StudentOnboardingPrompt } from "@/components/student/student-onboarding-prompt";
import { StudentDashboardSkeleton } from "@/components/student/student-page-skeletons";
import { Button } from "@/components/ui/button";
import { fetchStudentProfile } from "@/lib/student-profile-api";
import type { StudentProfileDto } from "@studyhouse/shared";
import {
  StudentApiError,
  studentFetchJsonCached,
} from "@/lib/student-client-api";
import { cn } from "@/lib/utils";

type MeResponse = {
  success: true;
  data: { user: { fullName: string } };
};

type DashboardResponse = {
  success: true;
  data: {
    enrolledCoursesCount: number;
    completedLessonsCount: number;
    inProgressCoursesCount: number;
    overallProgressPercent: number;
    continueLearning: null | {
      courseTitle: string;
      courseSlug: string;
      lessonId: string;
      lessonTitle: string;
    };
  };
};

type MyCoursesResponse = {
  success: true;
  data: {
    items: Array<{
      enrollmentId: string;
      progressPercent: number;
      completedLessons: number;
      totalLessons: number;
      course: {
        title: string;
        slug: string;
        thumbnailUrl: string | null;
        category: null | { name: string };
      };
      lastAccessedLesson: null | { id: string; title: string };
    }>;
  };
};

type CoursesResponse = {
  success: true;
  data: { items: CourseCardCourse[] };
};

type CategoriesResponse = {
  success: true;
  data: { items: { id: string; name: string; slug: string }[] };
};

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "طالب";
}

function categoryIcon(slug: string, name: string): LucideIcon {
  const hay = `${slug} ${name}`.toLowerCase();
  if (/جامع|university|أكاديم/.test(hay)) return GraduationCap;
  if (/برمج|code|dev/.test(hay)) return Zap;
  return LayoutGrid;
}

function isUniversityCourse(c: CourseCardCourse): boolean {
  const hay = `${c.category?.slug ?? ""} ${c.category?.name ?? ""} ${c.title}`;
  return /جامع|university|أكاديم|كلية/i.test(hay);
}

function DashboardSection({
  title,
  description,
  exploreHref,
  exploreLabel = "استكشف المزيد",
  children,
  className,
}: {
  title: string;
  description?: string;
  exploreHref: string;
  exploreLabel?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-heading md:text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button
          asChild
          variant="outline"
          className="shrink-0 rounded-xl border-heading/15 text-heading hover:border-primary hover:text-primary"
        >
          <Link href={exploreHref}>
            {exploreLabel}
            <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
      {children}
    </section>
  );
}

export function StudentDashboard(): React.ReactElement {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>("");
  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [dash, setDash] = useState<DashboardResponse["data"] | null>(null);
  const [myCourses, setMyCourses] = useState<MyCoursesResponse["data"]["items"]>(
    [],
  );
  const [catalog, setCatalog] = useState<CourseCardCourse[]>([]);
  const [categories, setCategories] = useState<
    CategoriesResponse["data"]["items"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [me, dashJson, mine, pub, cats, prof] = await Promise.all([
        studentFetchJsonCached<MeResponse>("/auth/me"),
        studentFetchJsonCached<DashboardResponse>("/student/dashboard"),
        studentFetchJsonCached<MyCoursesResponse>("/student/my-courses"),
        studentFetchJsonCached<CoursesResponse>("/courses?page=1&pageSize=48"),
        studentFetchJsonCached<CategoriesResponse>(
          "/categories?page=1&pageSize=12",
        ).catch(
          () =>
            ({
              success: true as const,
              data: { items: [] },
            }) satisfies CategoriesResponse,
        ),
        fetchStudentProfile().catch(() => null),
      ]);
      setUserName(firstName(me.data.user.fullName));
      setProfile(prof);
      setDash(dashJson.data);
      setMyCourses(mine.data.items);
      setCatalog(pub.data.items);
      setCategories(cats.data.items);
    } catch (e) {
      setError(
        e instanceof StudentApiError
          ? e.message
          : "تعذّر تحميل لوحة التعلّم.",
      );
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const popular = useMemo(() => catalog.slice(0, 4), [catalog]);

  const quickCourses = useMemo(
    () =>
      catalog.filter(
        (c) =>
          c.estimatedDurationMinutes != null &&
          c.estimatedDurationMinutes > 0 &&
          c.estimatedDurationMinutes <= 120,
      ).slice(0, 4),
    [catalog],
  );

  const longCourses = useMemo(
    () =>
      catalog.filter(
        (c) =>
          c.estimatedDurationMinutes != null && c.estimatedDurationMinutes >= 240,
      ).slice(0, 4),
    [catalog],
  );

  const universityCourses = useMemo(
    () => catalog.filter(isUniversityCourse).slice(0, 4),
    [catalog],
  );

  const popularDescription = useMemo(() => {
    const parts: string[] = [];
    if (profile?.interests.length) {
      parts.push("اخترنا لك كورسات قريبة من اهتماماتك");
    }
    if (profile?.currentLevel) {
      parts.push("سنراعي مستواك الحالي في الاقتراحات");
    }
    if (parts.length === 0) {
      return "كورسات يختارها المتعلمون كثيراً على المنصة.";
    }
    return parts.join(" — ");
  }, [profile]);

  const onboardingDone = searchParams.get("onboarding") === "done";

  if (loading && !dash) {
    return <StudentDashboardSkeleton />;
  }

  if (error && !dash) {
    return (
      <div className={cn(STUDENT_CONTENT_PAD, "py-12")}>
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-center text-sm text-red-900">
          {error}
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const d = dash!;

  return (
    <div className="pb-16">
      {/* هيرو — تدرج مختارات الكتالوج */}
      <section
        className={cn(
          "relative overflow-hidden border-b-[3px] border-primary/45 text-white",
          "bg-[linear-gradient(118deg,hsl(222_47%_10%)_0%,hsl(222_47%_17%)_38%,hsl(265_38%_24%)_72%,hsl(222_47%_14%)_100%)]",
          "shadow-[0_16px_40px_-22px_hsl(222_47%_10%_/_0.5)]",
        )}
        aria-label="ترحيب"
      >
        <div
          className="pointer-events-none absolute -start-16 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 end-0 h-40 w-40 rounded-full bg-[hsl(265_55%_40%_/_0.2)] blur-3xl"
          aria-hidden
        />

        <div className={cn("relative py-5 sm:py-6 md:py-7", STUDENT_CONTENT_PAD)}>
          <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
            مرحباً
          </p>
          <h1 className="mt-1.5 text-balance text-2xl font-bold leading-tight text-white sm:text-3xl">
            {userName ? (
              <>
                أهلاً، <span className="text-primary">{userName}</span>
              </>
            ) : (
              "أهلاً بك في رحلتك"
            )}
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/80 sm:text-sm">
            تابع دروسك بهدوء — تقدّمك محفوظ ومرئي من هنا.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 sm:gap-2.5">
            {[
              {
                label: "كورساتك",
                value: d.enrolledCoursesCount,
                icon: GraduationCap,
              },
              {
                label: "دروس مكتملة",
                value: d.completedLessonsCount,
                icon: BookOpen,
              },
              {
                label: "قيد التقدّم",
                value: d.inProgressCoursesCount,
                icon: TrendingUp,
              },
              {
                label: "التقدّم الكلي",
                value: `${d.overallProgressPercent}%`,
                icon: Sparkles,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex min-w-[6.75rem] items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-sm sm:min-w-[7rem] sm:px-3"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" aria-hidden />
                <div>
                  <p className="text-[10px] text-white/70">{label}</p>
                  <p className="text-base font-bold tabular-nums leading-none sm:text-lg">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {d.continueLearning ? (
            <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">تابع من حيث توقفت</p>
                <p className="mt-1 font-semibold">{d.continueLearning.courseTitle}</p>
                <p className="text-sm text-white/70">
                  {d.continueLearning.lessonTitle}
                </p>
              </div>
              <Button
                asChild
                className="shrink-0 rounded-xl bg-primary shadow-brand hover:bg-[hsl(var(--primary-hover))]"
              >
                <Link
                  href={`/learn/${d.continueLearning.courseSlug}?lessonId=${d.continueLearning.lessonId}`}
                >
                  متابعة الدرس
                  <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <div className={cn("mx-auto max-w-[min(100%,100rem)] space-y-14 py-10 md:py-12", STUDENT_CONTENT_PAD)}>
        {onboardingDone ? (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            تم حفظ ملفك التعليمي — سنستخدمه لتحسين اقتراحات الكورسات.
          </div>
        ) : null}

        {profile?.needsOnboarding ? (
          <StudentOnboardingPrompt
            onDismiss={() =>
              setProfile((p) =>
                p ? { ...p, needsOnboarding: false } : p,
              )
            }
          />
        ) : null}

        {myCourses.length > 0 ? (
          <DashboardSection
            title="كورساتي"
            description="وصول سريع لكل ما سجّلت به."
            exploreHref="/student/my-courses"
            exploreLabel="عرض الكل"
          >
            <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {myCourses.map((row) => (
                <MyCourseCard
                  key={row.enrollmentId}
                  row={row}
                  layout="carousel"
                />
              ))}
            </div>
          </DashboardSection>
        ) : null}

        {/* التصنيفات */}
        {categories.length > 0 ? (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-heading md:text-2xl">
                استكشف حسب المجال
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                اختر مجالاً يناسب اهتمامك.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => {
                const Icon = categoryIcon(c.slug, c.name);
                return (
                  <Link
                    key={c.id}
                    href={`/courses?categorySlug=${encodeURIComponent(c.slug)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/90 bg-card px-4 py-2.5 text-sm font-medium text-heading shadow-sm transition hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-4 w-4 text-primary/80" aria-hidden />
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* الأكثر شهرة */}
        {popular.length > 0 ? (
          <DashboardSection
            title="الأكثر شيوعاً"
            description={popularDescription}
            exploreHref="/student/explore"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((course) => (
                <CatalogCourseCard
                  key={course.id}
                  course={course}
                  detailBasePath="/student/courses"
                />
              ))}
            </div>
          </DashboardSection>
        ) : null}

        {/* كورسات سريعة */}
        {quickCourses.length > 0 ? (
          <DashboardSection
            title="كورسات سريعة"
            description="محتوى مركّز يمكن إنجازه خلال ساعتين أو أقل."
            exploreHref="/student/explore"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickCourses.map((course) => (
                <CatalogCourseCard key={course.id} course={course} />
              ))}
            </div>
          </DashboardSection>
        ) : null}

        {/* كورسات طويلة */}
        {longCourses.length > 0 ? (
          <DashboardSection
            title="كورسات عميقة"
            description="مسارات أطول لمن يريد تعلّماً ممتداً."
            exploreHref="/student/explore"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {longCourses.map((course) => (
                <CatalogCourseCard key={course.id} course={course} />
              ))}
            </div>
          </DashboardSection>
        ) : null}

        {/* جامعات */}
        {universityCourses.length > 0 ? (
          <DashboardSection
            title="كورسات جامعية وأكاديمية"
            description="محتوى موجّه للطلاب والمسارات الأكاديمية."
            exploreHref="/student/explore"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {universityCourses.map((course) => (
                <CatalogCourseCard key={course.id} course={course} />
              ))}
            </div>
          </DashboardSection>
        ) : null}
      </div>
    </div>
  );
}
