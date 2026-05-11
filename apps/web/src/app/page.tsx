import { ArrowLeft, BookOpen, Sparkles, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import {
  CourseCard,
  type CourseCardCourse,
} from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { fetchPublicApi } from "@/lib/server-api";
import { APP_NAME_AR } from "@studyhouse/shared";

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
      "/api/v1/courses?page=1&pageSize=3",
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
      "/api/v1/categories?page=1&pageSize=10",
    )) as CategoriesJson;
    return json.data.items.map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const [featured, categories] = await Promise.all([
    loadFeaturedCourses(),
    loadCategoryChips(),
  ]);

  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh noise-soft absolute inset-0 -z-10" aria-hidden />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 md:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-heading">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-float ring-1 ring-primary/20">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <span>{APP_NAME_AR}</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            تعلّم بلمسة بصرية دافئة
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-20 pt-8 md:px-8 md:pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              مساحة تعليمية عربية — هوية واضحة ومريحة للعين
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl lg:leading-[1.1]">
              تعلّم بثقة
              <span className="mt-2 block text-primary">مع تجربة LMS تراعي العربية</span>
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              منصة كورسات بخط عربي انسيابي، بطاقات بيضاء ناعمة، وقرارات لونية
              صريحة: برتقالي للخطوة التالية، وأزرق سماوي للمحتوى التعليمي — بدون
              لوحة رمادية مُرهقة.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild className="px-6 shadow-brand">
                <Link href="/courses">استكشف الكورسات</Link>
              </Button>
              <Button asChild variant="cyan" className="px-6">
                <Link href="#featured">
                  الكورسات المختارة
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-6">
                <Link href="#trust">لماذا هذا الشكل؟</Link>
              </Button>
            </div>
            <dl className="grid max-w-xl grid-cols-3 gap-3 pt-1 text-sm">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-float">
                <dt className="text-muted-foreground">اتجاه الواجهة</dt>
                <dd className="mt-1.5 text-xl font-bold text-heading">RTL</dd>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-float">
                <dt className="text-muted-foreground">الإحساس</dt>
                <dd className="mt-1.5 text-xl font-bold text-heading">مرِح</dd>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-float">
                <dt className="text-muted-foreground">السطح</dt>
                <dd className="mt-1.5 text-xl font-bold text-heading">فاتح</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -end-8 -top-10 h-36 w-36 rounded-full bg-brand-purple blur-3xl" />
            <div className="pointer-events-none absolute -bottom-6 start-4 h-28 w-28 rounded-full bg-secondary blur-2xl" />
            <div
              id="preview"
              className="relative rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-card"
            >
              <div className="absolute inset-x-10 -top-8 h-28 rounded-[1.75rem] bg-gradient-to-l from-primary/20 via-transparent to-secondary/30 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-heading">
                      لوحة تلميحات بصرية
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      ظلال ناعمة، زوايا كبيرة، وطبقة ألوان تحاكي الفصول دون صخب.
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground ring-1 ring-border/60">
                    هوية LMS
                  </span>
                </div>
                <div className="grid gap-4">
                  <div className="h-36 rounded-2xl bg-gradient-to-bl from-secondary/80 via-card to-brand-purple/40 ring-1 ring-border/60" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-2 rounded-2xl bg-secondary/60 px-3 py-4 text-xs font-medium text-secondary-foreground ring-1 ring-sky-100">
                      <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                      تقدّم واضح
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl bg-brand-purple px-3 py-4 text-xs font-medium text-accent-foreground ring-1 ring-purple-100">
                      <Users className="h-4 w-4 text-primary" aria-hidden />
                      تجربة جماعية
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl bg-card px-3 py-4 text-xs font-medium text-muted-foreground ring-1 ring-border">
                      جلسات مرنة
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    الشريط الجانبي للإدارة على اليمين في الواجهة العربية — محتوى
                    الطرف الآخر يبقى هو المحور البصري.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featured.length > 0 ? (
          <section id="featured" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  مختارات من الكتالوج
                </p>
                <h2 className="text-xl font-bold md:text-2xl">
                  كورسات جاهزة للاستكشاف
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                  عيّنة حية من المنشور حاليًا — تتحدّث البيانات مع لوحة الإدارة دون
                  أي خطوة إضافية هنا.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/courses">عرض الكل</Link>
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        ) : null}

        {categories.length > 0 ? (
          <section className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                تصنيفات سريعة
              </p>
              <h2 className="text-xl font-bold md:text-2xl">ابدأ من مجالك</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                انتقل مباشرة إلى الكورسات ضمن التصنيف الذي يهمّك.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/courses?categorySlug=${encodeURIComponent(c.slug)}`}
                  className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-heading shadow-sm ring-1 ring-border/50 transition-colors hover:border-secondary hover:bg-secondary/60 hover:text-secondary-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section
          id="trust"
          className="grid gap-6 rounded-[1.75rem] border border-border/70 bg-card/70 p-6 shadow-card backdrop-blur md:grid-cols-3 md:p-8"
        >
          <div className="space-y-2">
            <h2 className="text-base font-bold md:text-lg">قرارات لونية محسوبة</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              برتقالي دافئ للخطوات الحاسمة، سماوي للمساحات التعليمية، وبنفسجي خفيف
              للتمييز — مع تركيز على الوضوح لا الإزعاج.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold md:text-lg">عربي يُقرأ بسلاسة</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              خط Cairo عبر Next/font مع مسافات سخية وبطاقات بيضاء ترتفع بلطف فوق
              خلفية كريمية هادئة.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold md:text-lg">RTL من الأساس</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              كل المحاذاة والمسارات مصممة لتبدأ من اليمين — لتبدو لوحة الإدارة
              والكتالوج العام كمنتج واحد متماسك.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-card/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>{APP_NAME_AR} — تجربة LMS خفيفة ومحترمة للمتعلّم العربي</p>
          <p className="text-xs md:text-sm">
            API مستقل · جاهز للمراحل القادمة دون إرباك الواجهة
          </p>
        </div>
      </footer>
    </div>
  );
}
