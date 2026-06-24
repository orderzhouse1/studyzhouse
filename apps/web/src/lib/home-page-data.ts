import type { CourseCardCourse } from "@/components/courses/course-card";
import type { PopularCategoryColumn } from "@/components/marketing/popular-by-category";
import type { HomepageHeroStatPublicItem } from "@studyhouse/shared";
import { PUBLIC_PAGES_REVALIDATE } from "@/lib/public-pages-cache";
import { fetchPublicApiMaybe } from "@/lib/server-api";

/** @deprecated استخدم PUBLIC_PAGES_REVALIDATE */
export const HOME_PAGE_REVALIDATE = PUBLIC_PAGES_REVALIDATE;

type CoursesJson = {
  success: true;
  data: { items: CourseCardCourse[] };
};

type CategoriesJson = {
  success: true;
  data: { items: { id: string; name: string; slug: string }[] };
};

type HeroStatsJson = {
  success: true;
  data: { items: HomepageHeroStatPublicItem[] };
};

const fetchOpts = { revalidate: PUBLIC_PAGES_REVALIDATE } as const;

async function loadFeaturedCourses(): Promise<CourseCardCourse[]> {
  const json = await fetchPublicApiMaybe(
    "/api/v1/courses?page=1&pageSize=4",
    fetchOpts,
  );
  if (!json || typeof json !== "object" || !("data" in json)) return [];
  return (json as CoursesJson).data.items;
}

async function loadCategoryChips(): Promise<
  { name: string; slug: string }[]
> {
  const json = await fetchPublicApiMaybe(
    "/api/v1/categories?page=1&pageSize=12",
    fetchOpts,
  );
  if (!json || typeof json !== "object" || !("data" in json)) return [];
  return (json as CategoriesJson).data.items.map((c) => ({
    name: c.name,
    slug: c.slug,
  }));
}

async function loadCoursesForCategory(
  slug: string,
): Promise<CourseCardCourse[]> {
  const json = await fetchPublicApiMaybe(
    `/api/v1/courses?categorySlug=${encodeURIComponent(slug)}&page=1&pageSize=3`,
    fetchOpts,
  );
  if (!json || typeof json !== "object" || !("data" in json)) return [];
  return (json as CoursesJson).data.items;
}

export type HomePageData = {
  featured: CourseCardCourse[];
  categories: { name: string; slug: string }[];
  popularColumns: PopularCategoryColumn[];
  heroStats: HomepageHeroStatPublicItem[];
};

async function loadHeroStats(): Promise<HomepageHeroStatPublicItem[]> {
  const json = await fetchPublicApiMaybe(
    "/api/v1/marketing/homepage-hero-stats",
    fetchOpts,
  );
  if (!json || typeof json !== "object" || !("data" in json)) return [];
  const items = (json as HeroStatsJson).data.items;
  return Array.isArray(items) ? items : [];
}

/**
 * جلب بيانات الصفحة الرئيسية:
 * 1) كورسات مميزة + تصنيفات بالتوازي
 * 2) كورسات أعلى 3 تصنيفات بالتوازي (بعد معرفة الـ slugs)
 * عند فشل API يُرجع فراغًا دون كسر الصفحة.
 */
export async function loadHomePageData(): Promise<HomePageData> {
  const [featured, categories, heroStats] = await Promise.all([
    loadFeaturedCourses(),
    loadCategoryChips(),
    loadHeroStats(),
  ]);

  const topCategories = categories.slice(0, 3);
  let popularColumns: PopularCategoryColumn[] = [];

  if (topCategories.length > 0) {
    const lists = await Promise.all(
      topCategories.map((category) =>
        loadCoursesForCategory(category.slug).then((courses) => ({
          category,
          courses,
        })),
      ),
    );
    popularColumns = lists;
  }

  return { featured, categories, popularColumns, heroStats };
}
