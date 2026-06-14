import Link from "next/link";

import { cn } from "@/lib/utils";

export function HomeMobileSectionTitle({
  title,
  seeAllHref,
  seeAllLabel = "عرض الكل",
  className,
}: {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-bold text-heading">{title}</h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="shrink-0 text-xs font-semibold text-primary"
        >
          {seeAllLabel}
        </Link>
      ) : null}
    </div>
  );
}
