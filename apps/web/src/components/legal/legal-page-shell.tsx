import { Scale } from "lucide-react";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

export function LegalPageShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader />

      <main className={cn("pb-4", className)}>
        <section
          className="relative border-b border-border/60 bg-[linear-gradient(165deg,hsl(222_47%_97%)_0%,hsl(0_0%_100%)_55%,hsl(24_95%_53%_/_0.06)_100%)]"
          aria-labelledby="legal-page-title"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,hsl(24_95%_53%_/_0.12)_0%,transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12 md:py-14">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Scale className="h-3.5 w-3.5" aria-hidden />
              وثيقة قانونية
            </p>
            <h1
              id="legal-page-title"
              className="mt-4 text-2xl font-bold tracking-tight text-heading sm:text-3xl"
            >
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              آخر تحديث:{" "}
              <time dateTime="2026-05-19">{LEGAL_LAST_UPDATED}</time>
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
