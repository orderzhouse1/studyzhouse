import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import type { CourseCardCourse } from "@/components/courses/course-card";
import {
  CoursesCatalogSidebar,
  type CatalogFilters,
} from "@/components/courses/courses-catalog-sidebar";
import { CoursesCatalogSort } from "@/components/courses/courses-catalog-sort";
import { EmptyState } from "@/components/layout/empty-state";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { fetchPublicApi } from "@/lib/server-api";

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
  searchParams: Promise<{
    page?: string;
    search?: string;
    categorySlug?: string;
    pricingType?: string;
    sort?: string;
  }>;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const filters: CatalogFilters = {
    search: sp.search,
    categorySlug: sp.categorySlug,
    pricingType:
      sp.pricingType === "FREE" || sp.pricingType === "PAID"
        ? sp.pricingType
        : undefined,
    sort: sp.sort,
  };

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", "12");
  if (filters.search?.trim()) qs.set("search", filters.search.trim());
  if (filters.categorySlug?.trim()) qs.set("categorySlug", filters.categorySlug.trim());
  if (filters.pricingType) qs.set("pricingType", filters.pricingType);
  if (filters.sort && filters.sort !== "newest") qs.set("sort", filters.sort);

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader coursesActive />
      <main className="mx-auto w-full max-w-[min(100%,88rem)] px-4 pb-16 pt-2 sm:px-6 md:px-8 md:pt-4">
        <header className="mb-8 space-y-1">
          <h1 className="text-2xl font-bold text-[hsl(222_47%_12%)] sm:text-3xl">
            الكورسات
          </h1>
          <p className="text-sm text-muted-foreground">
            استكشف الكورسات المنشورة واختر ما يناسبك.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <CoursesCatalogSidebar categories={categoryChips} filters={filters} />

          <div className="min-w-0 flex-1 space-y-5">
            <CoursesCatalogSort filters={filters} total={meta.total} />

            {items.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-6 w-6" aria-hidden />}
                title="لا كورسات مطابقة"
                description="جرّب تغيير التصفية أو العودة لعرض جميع الكورسات."
                actionLabel="عرض الكل"
                actionHref="/courses"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((course) => (
                  <CatalogCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {meta.totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
                <span>
                  صفحة {meta.page} من {meta.totalPages}
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
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

