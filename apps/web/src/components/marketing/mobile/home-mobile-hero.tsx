import { Search } from "lucide-react";
import Link from "next/link";

import { APP_NAME_AR } from "@studyhouse/shared";

const PAGE_BG = "hsl(215 22% 97%)";

/**
 * هيرو جوال — تصميم ناعم: تدرج كحلي خفيف، موجة هادئة، ودمج سلس مع الصفحة.
 */
export function HomeMobileHero(): React.ReactElement {
  return (
    <section
      className="relative w-full overflow-hidden pb-5"
      aria-label="ترحيب"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[10.5rem]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222_47%_15%)] via-[hsl(222_47%_14%_/_0.92)] to-[hsl(222_47%_14%_/_0.55)]" />

        <div className="absolute -end-14 -top-8 h-44 w-44 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute -start-10 top-6 h-36 w-36 rounded-full bg-[hsl(222_47%_20%_/_0.45)] blur-3xl" />

        <svg
          className="absolute inset-x-0 bottom-[2.75rem] h-14 w-full opacity-90"
          viewBox="0 0 400 56"
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(222 47% 14% / 0.55)"
            d="M0,28 C70,14 140,42 210,26 C280,12 340,38 400,22 L400,56 L0,56 Z"
          />
        </svg>

        <div
          className="absolute inset-x-0 bottom-0 h-[4.5rem]"
          style={{
            background: `linear-gradient(to bottom, transparent 0%, ${PAGE_BG} 88%)`,
          }}
        />
      </div>

      <div className="relative px-4 pb-1 pt-7">
        <div className="relative z-10 max-w-[18rem]">
          <p className="text-start text-[0.7rem] font-medium text-white/60">
            مرحبًا بك في
          </p>
          <h1 className="mt-1 text-start text-[1.15rem] font-bold leading-snug tracking-tight text-white/95">
            {APP_NAME_AR}
          </h1>
        </div>

        <Link
          href="/courses"
          className="relative z-10 mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/30 bg-white/95 px-4 py-3 text-start shadow-[0_16px_40px_-20px_hsl(222_47%_14%_/_0.35)] backdrop-blur-sm transition active:scale-[0.99]"
        >
          <Search className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
          <span className="text-[0.8125rem] text-muted-foreground/90">
            ابحث في الكورسات أو التصنيف…
          </span>
        </Link>
      </div>
    </section>
  );
}
