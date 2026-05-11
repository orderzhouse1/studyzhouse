import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import {
  CourseCard,
  type CourseCardCourse,
} from "@/components/courses/course-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchPublicApi } from "@/lib/server-api";
import { APP_NAME_AR } from "@studyhouse/shared";

export const dynamic = "force-dynamic";

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

type CategoriesJson = {
  success: true;
  data: { items: { id: string; name: string; slug: string }[] };
};

async function loadCategories(): Promise<{ name: string; slug: string }[]> {
  try {
    const json = (await fetchPublicApi(
      "/api/v1/categories?page=1&pageSize=40",
    )) as CategoriesJson;
    return json.data.items.map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    return [];
  }
}

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

  let json: CoursesJson;
  let categoryChips: { name: string; slug: string }[];
  try {
    const results = await Promise.all([
      fetchPublicApi(`/api/v1/courses?${qs.toString()}`) as Promise<CoursesJson>,
      loadCategories(),
    ]);
    json = results[0];
    categoryChips = results[1];
  } catch {
    json = {
      success: true,
      data: { items: [] },
      meta: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
    };
    categoryChips = [];
  }

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

  const activeSlug = sp.categorySlug?.trim() ?? "";

  return (
    <div className="relative">
      <div className="hero-mesh noise-soft absolute inset-0 -z-10" aria-hidden />

      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-16 pt-8 md:px-8 md:pt-10">
        <PageHeader
          eyebrow="كتالوج عام"
          title="الكورسات المنشورة"
          description="صفحة استكشاف واسعة وبطاقات بيضاء ناعمة — فلتر تصنيف خفيف عند توفر البيانات، مع ترقيم صفحات واضح."
          actions={
            <Button asChild variant="outline">
              <Link href="/">{APP_NAME_AR} — الرئيسية</Link>
            </Button>
          }
        />

        {categoryChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-3 shadow-sm backdrop-blur md:px-5">
            <span className="text-xs font-semibold text-muted-foreground">
              التصنيفات:
            </span>
            <Link
              href={
                sp.search?.trim()
                  ? `/courses?search=${encodeURIComponent(sp.search.trim())}`
                  : "/courses"
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeSlug === ""
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "bg-muted/40 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
            >
              الكل
            </Link>
            {categoryChips.map((c) => {
              const nextQs = new URLSearchParams();
              if (sp.search?.trim()) nextQs.set("search", sp.search.trim());
              nextQs.set("categorySlug", c.slug);
              const href = `/courses?${nextQs.toString()}`;
              const active = activeSlug === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-brand"
                      : "border border-border/80 bg-card text-heading hover:border-secondary hover:bg-secondary/50"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" aria-hidden />}
            title="لا كورسات منشورة بعد"
            description="يمكن للمسؤول إنشاء كورس من لوحة الإدارة ثم نشره ليظهر هنا تلقائيًا."
            actionLabel="العودة للرئيسية"
            actionHref="/"
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-card">
          <span>
            صفحة {meta.page} من {meta.totalPages} — إجمالي {meta.total} كورسًا
          </span>
          <div className="flex items-center gap-2">
            {prevHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={prevHref}>السابق</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                السابق
              </Button>
            )}
            {nextHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={nextHref}>التالي</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                التالي
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
