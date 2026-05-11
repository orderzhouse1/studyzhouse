import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Layers, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublicApiMaybe } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type CourseDetailJson = {
  success: true;
  data: {
    course: {
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
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const raw = await fetchPublicApiMaybe(
    `/api/v1/courses/${encodeURIComponent(slug)}`,
  );
  const json = raw as CourseDetailJson | null;

  if (!json?.success) {
    return { title: "كورس غير موجود" };
  }

  return {
    title: json.data.course.title,
    description: json.data.course.shortDescription ?? undefined,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const json = (await fetchPublicApiMaybe(
    `/api/v1/courses/${encodeURIComponent(slug)}`,
  )) as CourseDetailJson | null;

  if (!json?.success) {
    notFound();
  }

  const course = json.data.course;

  const priceLabel =
    course.pricingType === "FREE"
      ? "مجاني"
      : `${course.priceAmount ?? "—"} ${course.currency}`;

  return (
    <div className="relative">
      <div className="hero-mesh noise-soft absolute inset-0 -z-10" aria-hidden />

      <section className="mx-auto w-full max-w-5xl px-6 pb-10 pt-8 md:px-8 md:pt-10">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-card md:p-7">
          <div className="pointer-events-none absolute -start-24 top-0 h-48 w-48 rounded-full bg-secondary/50 blur-3xl" />
          <div className="pointer-events-none absolute -end-16 bottom-0 h-40 w-40 rounded-full bg-brand-purple blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={course.pricingType === "FREE" ? "free" : "paid"}>
                  {priceLabel}
                </Badge>
                {course.category ? (
                  <Badge variant="outline">{course.category.name}</Badge>
                ) : null}
                <Badge variant="secondary">المستوى: {course.level}</Badge>
              </div>
              <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
                {course.title}
              </h1>
              {course.shortDescription ? (
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                  {course.shortDescription}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild className="shadow-brand">
                  <Link href="#about">تفاصيل الكورس</Link>
                </Button>
                <Button asChild variant="cyan">
                  <Link href="/courses">الكتالوج</Link>
                </Button>
              </div>
            </div>
            <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:max-w-md lg:w-80">
              <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-float">
                <div className="flex items-center gap-2 text-primary">
                  <Layers className="h-4 w-4" aria-hidden />
                  <span className="text-xs font-semibold text-muted-foreground">
                    الدروس
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold text-heading">
                  {course.lessonCount}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-float">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" aria-hidden />
                  <span className="text-xs font-semibold text-muted-foreground">
                    المدة
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold text-heading">
                  {course.estimatedDurationMinutes
                    ? `${course.estimatedDurationMinutes} د`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button asChild variant="outline">
            <Link href="/courses">العودة للكتالوج</Link>
          </Button>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl space-y-8 px-6 pb-16 md:px-8">
        <div
          id="about"
          className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card scroll-mt-28"
        >
          <div className="relative aspect-[21/9] w-full bg-muted/40">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-secondary/40" />
            )}
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1.6fr_0.9fr] md:p-8">
            <article id="about-text" className="space-y-3">
              <h2 className="text-lg font-bold">عن الكورس</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            </article>

            <aside className="space-y-3 rounded-xl border border-border/70 bg-secondary/35 p-5 shadow-sm ring-1 ring-secondary/80">
              <p className="text-sm font-bold text-heading">ملخص سريع</p>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">عدد الدروس</dt>
                  <dd className="font-semibold text-heading">{course.lessonCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">مدة تقديرية</dt>
                  <dd className="font-semibold text-heading">
                    {course.estimatedDurationMinutes
                      ? `${course.estimatedDurationMinutes} دقيقة`
                      : "غير محددة"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">تاريخ النشر</dt>
                  <dd className="font-semibold text-heading">
                    {course.publishedAt
                      ? new Date(course.publishedAt).toLocaleDateString("ar")
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="flex items-start gap-2 font-medium text-heading">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  معاينة الدروس داخل المنصّة ستُضاف لاحقًا — هذا العرض يعرض بيانات
                  الكورس المنشور فقط.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
