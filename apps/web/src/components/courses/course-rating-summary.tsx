"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function CourseRatingSummary({
  averageRating,
  reviewCount,
  className,
  size = "md",
}: {
  averageRating: number | null;
  reviewCount: number;
  className?: string;
  size?: "sm" | "md";
}): React.ReactElement | null {
  if (!reviewCount || reviewCount <= 0 || averageRating == null) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-semibold text-heading",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Star
        className={cn(
          "fill-amber-400 text-amber-400",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
        aria-hidden
      />
      <span>{averageRating.toFixed(1)}</span>
      <span className="font-normal text-muted-foreground">
        ({reviewCount} {reviewCount === 1 ? "مراجعة" : "مراجعات"})
      </span>
    </div>
  );
}
