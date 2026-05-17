import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Code2,
  Globe2,
  Laptop,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { FeaturedCoursesBanner } from "@/components/marketing/featured-courses-banner";
import { HeroKiderStyle } from "@/components/marketing/hero-kider-style";
import { HomeFaqSection } from "@/components/marketing/home-faq";
import { HomeLatestCoursesFeed } from "@/components/marketing/home-latest-courses-feed";
import {
  loadPopularByCategoryColumns,
  PopularByCategorySection,
} from "@/components/marketing/popular-by-category";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { fetchPublicApi } from "@/lib/server-api";

/** تجنّب جلب API أثناء التوليد الثابت — يُنفَّذ الجلب عند الطلب فقط (لا ECONNREFUSED في `next build` بدون خادم). */
export const dynamic = "force-dynamic";

type CoursesJson = {
  success: true;
  data: { items: CourseCardCourse[] };
};

type CategoriesJson = {
  success: true;
  data: { items: { id: string; name: string; slug: string }[] };
};

async function loadFeaturedCourses(): Promise<CourseCardCourse[]> {
  try {
    const json = (await fetchPublicApi(
      "/api/v1/courses?page=1&pageSize=4",
      { noStore: true },
    )) as CoursesJson;
    return json.data.items;
  } catch {
    return [];
  }
}

async function loadCategoryChips(): Promise<
  { name: string; slug: string }[]
> {
  try {
    const json = (await fetchPublicApi(
      "/api/v1/categories?page=1&pageSize=12",
      { noStore: true },
    )) as CategoriesJson;
    return json.data.items.map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    return [];
  }
}

function categoryChipIcon(slug: string, name: string): LucideIcon {
  const hay = `${slug} ${name}`.toLowerCase();
  if (/ذكاء|اصطناع|ai\b/.test(hay)) return Sparkles;
  if (/بيانات|data/.test(hay)) return BarChart3;
  if (/حاسوب|برمج|code|dev/.test(hay)) return Code2;
  if (/تقنية|معلومات|it\b|tech/.test(hay)) return Laptop;
  if (/أعمال|business|إدارة|مالية/.test(hay)) return Briefcase;
  if (/شخصي|تطوير|skills|مهارات/.test(hay)) return Sprout;
  if (/صح|طبي|health|رعاية/.test(hay)) return ShieldCheck;
  if (/لغة|lang|english|عربي/.test(hay)) return Globe2;
  return LayoutGrid;
}

export default async function HomePage(): Promise<React.ReactElement> {
  const [featured, categories] = await Promise.all([
    loadFeaturedCourses(),
    loadCategoryChips(),
  ]);
  const popularColumns =
    categories.length > 0
      ? await loadPopularByCategoryColumns(categories.slice(0, 3))
      : [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader showFeaturedLink={featured.length > 0} />

      <HeroKiderStyle />

      <main className="mx-auto flex w-full max-w-[min(100%,88rem)] flex-col gap-8 px-4 pb-14 pt-4 sm:px-6 sm:pt-5 md:px-8 md:gap-10">
        {categories.length > 0 ? (
          <>
            <PopularByCategorySection columns={popularColumns} />
            <section
              className="relative w-screen max-w-[100vw] border-y border-border/70 bg-background [margin-inline:calc(50%-50vw)]"
              aria-labelledby="main-fields-heading"
            >
              <div className="mx-auto flex w-full max-w-[min(100%,88rem)] flex-col items-center justify-center gap-3 px-4 py-4 text-center sm:px-6 sm:py-5 md:px-8 lg:flex-row lg:flex-wrap lg:gap-x-5 lg:gap-y-2">
                <h2
                  id="main-fields-heading"
                  className="shrink-0 text-lg font-bold text-heading sm:text-xl"
                >
                  مجالات رئيسية
                </h2>

                <div className="flex min-w-0 flex-wrap items-center justify-center gap-2.5 lg:max-w-3xl lg:flex-1 lg:gap-3">
                  {categories.map((c) => {
                    const Icon = categoryChipIcon(c.slug, c.name);
                    return (
                      <Link
                        key={c.slug}
                        href={`/courses?categorySlug=${encodeURIComponent(c.slug)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border/90 bg-card px-3.5 py-2 text-sm font-medium text-heading shadow-sm transition-colors hover:border-primary hover:text-primary sm:px-4"
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        {c.name}
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href="/courses"
                  className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/90"
                >
                  عرض الكتالوج كاملاً
                </Link>
              </div>
            </section>
          </>
        ) : null}

        {featured.length > 0 ? (
          <FeaturedCoursesBanner courses={featured} />
        ) : null}

        {featured.length > 0 ? <HomeLatestCoursesFeed courses={featured} /> : null}

        <HomeFaqSection />
      </main>

      <SiteFooter showFeaturedLink={featured.length > 0} showFaqLink />
    </div>
  );
}
