import { BookOpen } from "lucide-react";
import Link from "next/link";

import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import { StudentCoursesCatalogGrid } from "@/components/student/student-courses-catalog-grid";
import type { CourseCardCourse } from "@/components/courses/course-card";
import {
  CoursesCatalogSidebar,
  type CatalogFilters,
} from "@/components/courses/courses-catalog-sidebar";
import { CoursesCatalogSort } from "@/components/courses/courses-catalog-sort";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { PUBLIC_PAGES_REVALIDATE } from "@/lib/public-pages-cache";
import { fetchPublicApiMaybe } from "@/lib/server-api";

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

export type CoursesCatalogSearchParams = {
  page?: string;
  search?: string;
  categorySlug?: string;
  pricingType?: string;
  sort?: string;
  adminPreview?: string;
};

async function loadCategories(): Promise<{ name: string; slug: string }[]> {
  const json = (await fetchPublicApiMaybe(
    "/api/v1/categories?page=1&pageSize=40",
    { revalidate: PUBLIC_PAGES_REVALIDATE },
  )) as CategoriesJson | null;
  if (!json?.success) return [];
  return json.data.items.map((c) => ({ name: c.name, slug: c.slug }));
}

function buildPageHref(
  basePath: string,
  qs: URLSearchParams,
  page: number,
  adminPreview?: boolean,
): string {
  const next = new URLSearchParams(qs);
  next.set("page", String(page));
  if (adminPreview) next.set("adminPreview", "1");
  return `${basePath}?${next.toString()}`;
}

export async function CoursesCatalog({
  basePath,
  searchParams,
  title = "الكورسات",
  description = "استكشف الكورسات المنشورة واختر ما يناسبك.",
}: {
  basePath: string;
  searchParams: Promise<CoursesCatalogSearchParams>;
  title?: string;
  description?: string;
}): Promise<React.ReactElement> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const adminPreview = sp.adminPreview === "1";

  const filters: CatalogFilters = {
    search: sp.search,
    categorySlug: sp.categorySlug,
    pricingType:
      sp.pricingType === "FREE" || sp.pricingType === "PAID"
        ? sp.pricingType
        : undefined,
    sort: sp.sort,
    adminPreview,
  };

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", "12");
  if (filters.search?.trim()) qs.set("search", filters.search.trim());
  if (filters.categorySlug?.trim()) {
    qs.set("categorySlug", filters.categorySlug.trim());
  }
  if (filters.pricingType) qs.set("pricingType", filters.pricingType);
  if (filters.sort && filters.sort !== "newest") qs.set("sort", filters.sort);

  const [coursesRaw, categoryChips] = await Promise.all([
    fetchPublicApiMaybe(`/api/v1/courses?${qs.toString()}`, {
      revalidate: PUBLIC_PAGES_REVALIDATE,
    }) as Promise<CoursesJson | null>,
    loadCategories(),
  ]);

  const json: CoursesJson = coursesRaw?.success
    ? coursesRaw
    : {
        success: true,
        data: { items: [] },
        meta: { page: 1, pageSize: 12, total: 0, totalPages: 1 },
      };

  const items = json.data.items;
  const meta = json.meta;
  const isStudentCatalog = basePath.startsWith("/student");
  const courseDetailBasePath = isStudentCatalog
    ? "/student/courses"
    : "/courses";

  const prevHref =
    meta.page > 1
      ? buildPageHref(basePath, qs, meta.page - 1, adminPreview)
      : null;

  const nextHref =
    meta.page < meta.totalPages
      ? buildPageHref(basePath, qs, meta.page + 1, adminPreview)
      : null;

  return (
    <div className="mx-auto w-full max-w-[min(100%,88rem)] px-4 pb-16 pt-2 sm:px-6 md:px-8 md:pt-4">
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold text-[hsl(222_47%_12%)] sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <CoursesCatalogSidebar
          basePath={basePath}
          categories={categoryChips}
          filters={filters}
        />

        <div className="@container min-w-0 flex-1 space-y-5">
          <CoursesCatalogSort
            basePath={basePath}
            filters={filters}
            total={meta.total}
          />

          {items.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" aria-hidden />}
              title="لا كورسات مطابقة"
              description="جرّب تغيير التصفية أو العودة لعرض جميع الكورسات."
              actionLabel="عرض الكل"
              actionHref={basePath}
            />
          ) : isStudentCatalog ? (
            <StudentCoursesCatalogGrid
              items={items}
              detailBasePath={courseDetailBasePath}
              compact={adminPreview}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 @min-[36rem]:grid-cols-4">
              {items.map((course) => (
                <CatalogCourseCard
                  key={course.id}
                  course={course}
                  detailBasePath={courseDetailBasePath}
                  compact={adminPreview}
                />
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
    </div>
  );
}
