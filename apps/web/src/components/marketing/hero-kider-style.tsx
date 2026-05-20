import { ArrowLeft, GraduationCap, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { APP_NAME_AR } from "@studyhouse/shared";

/** صورة تعليمية — أبعاد معتدلة للأداء */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200&h=800";

/** خلفية هيرو زرقاء غامقة (نفس عائلة ألوان المشروع 222°) */
const heroBg = "hsl(222 47% 10%)";

/**
 * هيرو banner واحد: صورة مطلقة + تدرجات دمج نحو أزرق غامق، مع لمسات برتقالية (primary).
 */
export function HeroKiderStyle(): React.ReactElement {
  return (
    <section
      className="relative isolate w-full overflow-hidden pb-6 pt-2 max-sm:pb-3 max-sm:pt-1 sm:pb-8 sm:pt-3"
      style={{ backgroundColor: heroBg }}
      aria-label="ترحيب"
    >
      {/* صورة — موبايل: خلفية كاملة | سطح مكتب: يسار مع دمج أفقي */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[58%] lg:w-[55%] max-sm:inset-0 max-sm:w-full"
        aria-hidden
      >
        <Image
          src={HERO_IMAGE}
          alt="طلاب في جلسة تعليمية"
          fill
          priority
          className="object-cover object-[32%_center] max-sm:object-[center_22%]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 720px"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,hsl(222_47%_10%_/_0.98)_0%,hsl(222_47%_10%_/_0.88)_28%,hsl(222_47%_10%_/_0.45)_52%,hsl(222_47%_10%_/_0.12)_68%,transparent_82%)] sm:hidden"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,hsl(222_47%_10%_/_0.55)_0%,transparent_32%)] sm:hidden"
          aria-hidden
        />
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,hsl(0_0%_100%_/_0)_0%,hsl(222_47%_10%_/_0.12)_38%,hsl(222_47%_10%_/_0.62)_52%,hsl(222_47%_10%_/_0.94)_100%)] sm:block"
          aria-hidden
        />
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(180deg,hsl(222_47%_10%_/_0.35)_0%,transparent_42%,hsl(0_0%_0%_/_0.22)_100%)] sm:block"
          aria-hidden
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_left,hsl(222_47%_10%)_0%,hsl(222_47%_10%_/_0.92)_30%,hsl(222_47%_10%_/_0.45)_52%,transparent_74%)] sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_75%_55%_at_100%_0%,hsl(24_95%_53%_/_0.09)_0%,transparent_55%)] sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_100%,hsl(24_95%_53%_/_0.08)_0%,transparent_55%)] sm:hidden"
        aria-hidden
      />

      {/*
        max-sm فقط: نص فوق الصورة | sm+: تخطيط سطح المكتب كما كان
      */}
      <div className="relative z-10 mx-auto flex min-h-[min(52vh,480px)] w-full max-w-[min(100%,88rem)] flex-col justify-center px-4 pb-8 pt-6 sm:px-6 sm:py-10 md:px-8 max-sm:min-h-[min(35svh,340px)] max-sm:justify-end max-sm:pb-5 max-sm:pt-4">
        <div className="relative w-full max-w-[560px] sm:me-auto sm:ms-0 sm:pe-8 md:pe-12 lg:pe-16">
          <Sparkles
            className="pointer-events-none absolute -top-1 end-0 hidden h-5 w-5 text-primary/50 sm:block sm:-top-0.5"
            aria-hidden
          />
          <Star
            className="pointer-events-none absolute end-0 top-[38%] hidden h-3.5 w-3.5 text-primary/45 sm:block sm:top-[40%]"
            aria-hidden
          />
          <GraduationCap
            className="pointer-events-none absolute -bottom-1 start-0 hidden h-6 w-6 text-primary/40 sm:bottom-0 sm:start-1 sm:block"
            aria-hidden
          />

          <p className="relative text-start text-xs font-semibold text-primary max-sm:leading-snug sm:text-sm sm:text-[0.9375rem]">
            مرحبًا بك في {APP_NAME_AR}
          </p>
          <h1 className="relative mt-1 text-start text-balance text-[1.2rem] font-bold leading-[1.12] tracking-tight text-white max-sm:mt-0.5 sm:mt-3 sm:text-[1.75rem] lg:text-[2rem] lg:leading-[1.15]">
            ابدأ رحلتك التعليمية
            <span className="mt-0.5 block text-primary max-sm:inline max-sm:mt-0"> من اليوم الأول.</span>
          </h1>
          <p className="relative mt-1 text-start text-pretty text-[0.8125rem] leading-snug text-slate-300 max-sm:line-clamp-1 sm:mt-3.5 sm:text-sm sm:leading-relaxed sm:text-[0.9375rem]">
            كورسات منظمة، تقدّم واضح، وتجربة عربية مريحة — خطوة بخطوة حتى تصل إلى
            هدفك دون تعقيد.
          </p>
          <div className="relative mt-2.5 flex flex-wrap items-center justify-start gap-2 max-sm:mt-2 sm:mt-6 sm:gap-3">
            <Button
              asChild
              className="h-9 rounded-full px-4 text-sm shadow-none ring-1 ring-white/15 max-sm:text-xs sm:h-12 sm:px-7 sm:text-base"
            >
              <Link href="/courses" className="gap-2">
                استكشف الكورسات
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-full border-2 border-primary bg-black/15 px-4 text-sm text-primary backdrop-blur-[2px] hover:bg-primary/15 max-sm:border-primary/90 max-sm:text-xs sm:h-12 sm:bg-transparent sm:px-7 sm:text-base sm:backdrop-blur-none"
            >
              <Link href="#site-footer" className="gap-2">
                تواصل معنا
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* تموج سفلي — بدون border؛ تداخل بكسل واحد يمنع خطًا رفيعًا بين الهيرو والموجة */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 w-full max-sm:h-9 sm:h-10"
        aria-hidden
      >
        <svg
          className="block h-full w-full text-background"
          viewBox="0 0 1200 48"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M0,24 C200,8 400,40 600,22 C800,4 1000,36 1200,20 L1200,48 L0,48 Z"
          />
        </svg>
      </div>
    </section>
  );
}
