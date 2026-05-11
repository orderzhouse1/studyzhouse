import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm",
        outline: "border-border text-foreground bg-card",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/25",
        warning:
          "border-transparent bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/25",
        muted:
          "border-transparent bg-muted text-muted-foreground ring-1 ring-border/70",
        published:
          "border-transparent bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/25",
        draft:
          "border-transparent bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/25",
        archived:
          "border-transparent bg-slate-200/90 text-slate-800 ring-1 ring-slate-300/80",
        free: "border-sky-200 bg-sky-50 text-sky-950 ring-1 ring-sky-200/80",
        paid: "border-purple-200 bg-purple-50 text-purple-950 ring-1 ring-purple-200/80",
        preview:
          "border-purple-200 bg-purple-50/90 text-purple-950 ring-1 ring-purple-200/70",
        video:
          "border-red-200 bg-red-50 text-red-950 ring-1 ring-red-200/70",
        incomplete:
          "border-amber-200 bg-amber-50 text-amber-950 ring-1 ring-amber-200/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
