import { Search } from "lucide-react";
import Link from "next/link";

import { APP_NAME_AR } from "@studyhouse/shared";

/** ألوان متناسقة مع بطاقات «كورسات مميزة» */
const HERO_PURPLE =
  "from-[hsl(265_45%_88%)] to-[hsl(265_40%_78%)]";
const HERO_PEACH =
  "from-[hsl(24_95%_88%)] to-[hsl(24_90%_78%)]";
const HERO_CYAN =
  "from-[hsl(192_60%_88%)] to-[hsl(192_55%_78%)]";

/**
 * هيرو جوال — خلفية باستيل متناسقة مع قسم الكورسات المميزة.
 */
export function HomeMobileHero(): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden pb-4"
      aria-label="ترحيب"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[6.25rem] overflow-hidden"
        aria-hidden
      >
        <svg
          className="absolute inset-x-0 top-0 h-full w-full"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="mobile-hero-wave-fill"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="hsl(265 45% 91%)" />
              <stop offset="48%" stopColor="hsl(265 40% 94%)" />
              <stop offset="100%" stopColor="hsl(24 95% 91%)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#mobile-hero-wave-fill)"
            d="M0,0 H400 V58 C340,82 270,44 200,66 C130,88 65,50 0,72 Z"
          />
        </svg>

        <svg
          className="absolute inset-x-0 bottom-0 h-10 w-full text-[hsl(24_90%_78%_/_0.22)]"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,18 C80,34 160,6 240,22 C300,32 350,12 400,24 L400,40 L0,40 Z"
          />
        </svg>

        <div
          className={`absolute end-0 -top-6 h-32 w-32 rounded-full bg-gradient-to-br ${HERO_PURPLE} opacity-55 blur-2xl`}
        />
        <div
          className={`absolute start-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br ${HERO_PEACH} opacity-50 blur-2xl`}
        />

        <div
          className={`absolute end-6 top-10 h-11 w-11 rounded-2xl bg-gradient-to-br ${HERO_PURPLE} opacity-45 rotate-12`}
        />
        <div
          className={`absolute start-5 top-3 h-8 w-8 rounded-full bg-gradient-to-br ${HERO_PEACH} opacity-55`}
        />
        <div
          className={`absolute start-16 top-9 h-3.5 w-3.5 rounded-full bg-gradient-to-br ${HERO_CYAN} opacity-70`}
        />
      </div>

      <div className="relative px-4 pt-6">
        <div className="relative z-10">
          <p className="text-start text-xs text-muted-foreground">
            مرحبًا بك في
          </p>
          <h1 className="mt-0.5 text-start text-[1.2rem] font-extrabold leading-tight tracking-tight text-heading">
            {APP_NAME_AR}
          </h1>
        </div>

        <Link
          href="/courses"
          className="relative z-10 mt-4 flex w-full items-center gap-2.5 rounded-full border border-[hsl(265_45%_88%)]/60 bg-white px-3.5 py-2.5 text-start shadow-[0_8px_24px_-12px_hsl(265_40%_50%_/_0.22)] ring-1 ring-black/[0.03] transition active:scale-[0.99]"
        >
          <Search className="h-4 w-4 shrink-0 text-primary/70" aria-hidden />
          <span className="text-xs text-muted-foreground">
            ابحث في الكورسات أو التصنيف…
          </span>
        </Link>
      </div>
    </section>
  );
}
