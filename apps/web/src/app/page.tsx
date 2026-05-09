import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { APP_NAME_AR } from "@studyhouse/shared";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh noise-soft absolute inset-0 -z-10" aria-hidden />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 md:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <BookOpen className="h-4 w-4" aria-hidden />
          </span>
          <span>{APP_NAME_AR}</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            نسخة أولية — الواجهة فقط
          </span>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 md:px-8 md:pt-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              تعلّم بترتيب… بتصميم يليق بالمحتوى العربي
            </div>
            <h1 className="text-balance text-4xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
              منصة كورسات عربية
              <span className="block text-primary">بهوية هادئة واحترافية</span>
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              هذا مكان مؤقت للمرحلة الأولى: إعداد التصميم، اتجاه RTL، والطبقة
              البصرية قبل بناء الدروس واللوحات. كل شيء هنا مُختبر ليبدو قريبًا من
              منتج SaaS عالي الجودة — وليس لوحة إدارة جاهزة بالرمادي فقط.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <Button asChild size="lg" className="rounded-xl px-7 text-base">
                <Link href="/courses">استكشف الكورسات</Link>
              </Button>
              <Button asChild size="lg" className="rounded-xl px-7 text-base">
                <Link href="#preview">
                  استعرض التجربة
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl px-7 text-base"
              >
                <Link href="#trust">تفاصيل الشكل والهوية</Link>
              </Button>
            </div>
            <dl className="grid max-w-xl grid-cols-3 gap-4 pt-2 text-sm">
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
                <dt className="text-muted-foreground">سرعة الإحساس</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  خفيف
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
                <dt className="text-muted-foreground">اتجاه الواجهة</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  RTL
                </dd>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
                <dt className="text-muted-foreground">الثيم</dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  فاتح
                </dd>
              </div>
            </dl>
          </div>

          <div
            id="preview"
            className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.04),0_18px_50px_rgba(15,23,42,0.08)]"
          >
            <div className="absolute inset-x-8 -top-6 h-24 rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent blur-2xl" />
            <div className="relative space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    بطاقة معاينة — Course shell
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    حدود ناعمة، ظل خفيف، ومساحات واسعة… جاهزة لتتحول لاحقًا إلى
                    بطاقة كورس حقيقية.
                  </p>
                </div>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground ring-1 ring-emerald-500/15">
                  مسودة
                </span>
              </div>
              <div className="grid gap-3">
                <div className="h-32 rounded-xl bg-muted/60 ring-1 ring-border/70" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-10 rounded-lg bg-muted/50 ring-1 ring-border/60" />
                  <div className="h-10 rounded-lg bg-muted/50 ring-1 ring-border/60" />
                  <div className="h-10 rounded-lg bg-muted/50 ring-1 ring-border/60" />
                </div>
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>تلميحات تخطيط لاحقًا: قائمة دروس على اليمين</span>
                  <span className="font-medium text-foreground">…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="trust"
          className="grid gap-6 rounded-2xl border border-border/70 bg-card/50 p-8 shadow-sm backdrop-blur md:grid-cols-3"
        >
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">هوية لونية هادئة</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ألوان قليلة، تباين واضح، وزر أساسي بثبات بصري — بدون تدرجات صاخبة
              تملأ الصفحة.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">خط عربي حديث</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cairo عبر <code className="rounded bg-muted px-1.5 py-0.5 text-xs">next/font</code>{" "}
              ليقرأ الطالب بسهولة على الشاشات الصغيرة والكبيرة.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">RTL بالكامل</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              الاتجاه من الجذر — لتبدأ لوحات التحكم لاحقًا بشريط جانبي يمين والمحتوى يسار.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>{APP_NAME_AR} — أساس المرحلة الأولى</p>
          <p className="text-xs md:text-sm">
            API منفصل على Express · قاعدة بيانات عبر Prisma · جاهز للخطوة التالية بدون تسرّع
          </p>
        </div>
      </footer>
    </div>
  );
}
