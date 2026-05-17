import { Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const SEARCH_PLACEHOLDER = "ابحث في الكورسات…";

export function HeaderSearchField({
  className,
  catalogHref = "/courses",
}: {
  className?: string;
  catalogHref?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex min-w-0 items-stretch overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm ring-1 ring-border/50",
        className,
      )}
    >
      <input
        type="search"
        name="q"
        placeholder={SEARCH_PLACEHOLDER}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        readOnly
        aria-label={SEARCH_PLACEHOLDER}
      />
      <Link
        href={catalogHref}
        className="flex shrink-0 items-center justify-center border-s border-border/80 bg-card px-3 text-primary transition hover:bg-muted/60"
        aria-label="الانتقال للبحث في الكورسات"
      >
        <Search className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
