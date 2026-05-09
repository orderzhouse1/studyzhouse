import type { Metadata } from "next";
import Link from "next/link";

import { CourseCard, type CourseCardCourse } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { fetchPublicApi } from "@/lib/server-api";
import { APP_NAME_AR } from "@studyhouse/shared";

export const metadata: Metadata = {
  title: "استكشف الكورسات",
};

type CoursesJson = {
  success: true;
  data: { items: CourseCardCourse[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; categorySlug?: string }>;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", "12");
  if (sp.search?.trim()) qs.set("search", sp.search.trim());
  if (sp.categorySlug?.trim()) qs.set("categorySlug", sp.categorySlug.trim());

  const json = (await fetchPublicApi(
    `/api/v1/courses?${qs.toString()}`,
  )) as CoursesJson;

  const items = json.data.items;
  const meta = json.meta;

  const prevHref =
    meta.page > 1
      ? `/courses?${new URLSearchParams({
          ...Object.fromEntries(qs.entries()),
          page: String(meta.page - 1),
        }).toString()}`
      : null;

  const nextHref =
    meta.page < meta.totalPages
      ? `/courses?${new URLSearchParams({
          ...Object.fromEntries(qs.entries()),
          page: String(meta.page + 1),
        }).toString()}`
      : null;

  return (
    <div className="relative">
      <div className="hero-mesh noise-soft absolute inset-0 -z-10" aria-hidden />

      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-8 md:py-14">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-primary">كتالوج عام</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            الكورسات المنشورة
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            قائمة نظيفة وبمساحات واسعة — جاهزة لاحقًا للفلترة المتقدمة. ما يزال
            المشغّل ووضع الدرس يأتي في مرحلة لاحقة.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">{APP_NAME_AR} — الرئيسية</Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-10 px-6 pb-20 md:px-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-foreground">لا كورسات منشورة بعد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              يمكن للمسؤول إنشاء كورس جديد من لوحة الإدارة ثم نشره هنا.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur">
          <span>
            صفحة {meta.page} من {meta.totalPages} — إجمالي {meta.total} كورسًا
          </span>
          <div className="flex items-center gap-2">
            {prevHref ? (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={prevHref}>السابق</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="rounded-xl" disabled>
                السابق
              </Button>
            )}
            {nextHref ? (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href={nextHref}>التالي</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="rounded-xl" disabled>
                التالي
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
