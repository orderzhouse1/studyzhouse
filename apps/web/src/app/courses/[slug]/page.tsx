import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublicApiMaybe } from "@/lib/server-api";

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

      <header className="mx-auto w-full max-w-5xl px-6 pb-10 pt-10 md:px-8 md:pt-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{priceLabel}</Badge>
              {course.category ? (
                <Badge variant="outline">{course.category.name}</Badge>
              ) : null}
              <Badge variant="muted">المستوى: {course.level}</Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {course.title}
            </h1>
            {course.shortDescription ? (
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {course.shortDescription}
              </p>
            ) : null}
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/courses">العودة للكتالوج</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-10 px-6 pb-20 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="relative aspect-[21/9] w-full bg-muted/40">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-accent/25" />
            )}
          </div>

          <div className="grid gap-8 p-8 md:grid-cols-[1.6fr_0.9fr] md:p-10">
            <article className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">عن الكورس</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            </article>

            <aside className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-6">
              <p className="text-sm font-semibold text-foreground">ملخص سريع</p>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">عدد الدروس</dt>
                  <dd className="font-medium text-foreground">{course.lessonCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">مدة تقديرية</dt>
                  <dd className="font-medium text-foreground">
                    {course.estimatedDurationMinutes
                      ? `${course.estimatedDurationMinutes} دقيقة`
                      : "غير محددة"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">تاريخ النشر</dt>
                  <dd className="font-medium text-foreground">
                    {course.publishedAt
                      ? new Date(course.publishedAt).toLocaleDateString("ar")
                      : "—"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                مرحلة التعلّم داخل المنصة ستُضاف لاحقًا — هذا العرض يعرض المحتوى
                المنشور فقط.
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
