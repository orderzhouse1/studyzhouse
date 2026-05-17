import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  accent = "orange",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "orange" | "cyan" | "violet" | "amber";
}): React.ReactElement {
  const topBar =
    accent === "cyan"
      ? "bg-[hsl(192_70%_45%)]"
      : accent === "violet"
        ? "bg-[hsl(265_55%_55%)]"
        : accent === "amber"
          ? "bg-[hsl(42_95%_55%)]"
          : "bg-primary";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className={cn("h-1", topBar)} aria-hidden />
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-heading">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-heading">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

export function DashboardChartPlaceholder({
  title,
  subtitle,
  variant = "donut",
}: {
  title: string;
  subtitle?: string;
  variant?: "donut" | "line";
}): React.ReactElement {
  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-heading">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        {variant === "donut" ? (
          <div
            className="h-36 w-36 rounded-full"
            style={{
              background:
                "conic-gradient(hsl(24 95% 53%) 0deg 120deg, hsl(222 47% 22%) 120deg 220deg, hsl(192 70% 45%) 220deg 300deg, hsl(265 55% 55%) 300deg 360deg)",
            }}
            aria-hidden
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-center text-[0.625rem] font-semibold text-muted-foreground">
                توزيع
                <br />
                المحتوى
              </div>
            </div>
          </div>
        ) : (
          <svg
            viewBox="0 0 320 120"
            className="h-full w-full max-h-40 text-primary"
            aria-hidden
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(24 95% 53%)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(24 95% 53%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,90 C40,70 80,100 120,55 160,40 200,65 240,30 280,20 320,35 L320,120 L0,120 Z"
              fill="url(#areaFill)"
            />
            <path
              d="M0,90 C40,70 80,100 120,55 160,40 200,65 240,30 280,20 320,35"
              fill="none"
              stroke="hsl(24 95% 53%)"
              strokeWidth="3"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export function DashboardMiniTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" | "muted" }[];
}): React.ReactElement {
  const toneClass = (tone?: string) => {
    if (tone === "ok") return "text-emerald-600";
    if (tone === "warn") return "text-amber-600";
    if (tone === "bad") return "text-red-600";
    return "text-heading";
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-[hsl(222_47%_14%)] px-4 py-2.5">
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <ul className="divide-y divide-border/60 p-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 px-2 py-2 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className={cn("font-bold tabular-nums", toneClass(row.tone))}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardListCard({
  title,
  items,
  emptyLabel = "لا توجد بيانات بعد",
}: {
  title: string;
  items: { primary: string; secondary?: string; meta?: string }[];
  emptyLabel?: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-bold text-heading">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item, i) => (
            <li key={`${item.primary}-${i}`} className="px-4 py-3">
              <p className="text-sm font-semibold text-heading">{item.primary}</p>
              {item.secondary ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.secondary}</p>
              ) : null}
              {item.meta ? (
                <p className="mt-1 text-[0.6875rem] text-muted-foreground/80">{item.meta}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
