import { BookOpen } from "lucide-react";
import Link from "next/link";

import { APP_NAME_AR } from "@studyhouse/shared";

export function HeaderBrand({
  href = "/",
  tagline = "تعلّم بخطوات واضحة",
}: {
  href?: string;
  tagline?: string | null;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-black/[0.06] sm:h-10 sm:w-10 sm:rounded-2xl">
        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold leading-tight tracking-tight text-heading sm:text-lg">
          {APP_NAME_AR}
        </span>
        {tagline ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium leading-none text-muted-foreground sm:text-xs">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export const HEADER_INNER_CLASS =
  "mx-auto flex w-full max-w-[min(100%,100rem)] items-center gap-3 px-6 py-2.5 sm:gap-4 sm:px-8 md:px-10 lg:px-14 xl:px-20";

export const HEADER_ROOT_CLASS =
  "sticky top-0 z-50 border-b border-border/90 bg-card/90 shadow-[0_8px_24px_-18px_hsl(222_47%_10%_/_0.2)] backdrop-blur-md";

export const HEADER_MOBILE_SEARCH_CLASS =
  "border-t border-border/60 bg-muted/25 px-6 py-2 sm:px-8 md:hidden md:px-10 lg:px-14 xl:px-20";
