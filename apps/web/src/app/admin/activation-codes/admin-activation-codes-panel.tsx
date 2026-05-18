"use client";

import { Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminActivationCodeComposer } from "@/components/admin/activation-codes/admin-activation-code-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  maskedCode: string;
  course: {
    id: string;
    title: string;
    slug: string;
    pricingType: string;
    status: string;
  };
  status: "ACTIVE" | "DISABLED" | "EXPIRED";
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
};

type ListResponse = {
  success: true;
  data: { items: Row[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const STATUS_AR: Record<Row["status"], string> = {
  ACTIVE: "نشط",
  DISABLED: "معطّل",
  EXPIRED: "منتهٍ",
};

type StatusFilter = "" | Row["status"];

const STATUS_FILTER_LABEL: Record<Exclude<StatusFilter, "">, string> = {
  ACTIVE: "نشط",
  DISABLED: "معطّل",
  EXPIRED: "منتهٍ",
};

function statusBadgeVariant(
  s: Row["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "ACTIVE") return "success";
  if (s === "DISABLED") return "muted";
  return "warning";
}

export function AdminActivationCodesPanel(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialNew = searchParams.get("new") === "1";

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const composerScrollPending = useRef(false);
  const didApplyUrlState = useRef(false);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    if (search.trim()) p.set("search", search.trim());
    if (statusFilter) p.set("status", statusFilter);
    return p.toString();
  }, [page, search, statusFilter]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(
        `/admin/activation-codes?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل أكواد التفعيل.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (didApplyUrlState.current) return;
    didApplyUrlState.current = true;
    if (initialNew) {
      setComposerOpen(true);
      composerScrollPending.current = true;
    }
  }, [initialNew]);

  const countLabel = useMemo(() => {
    if (!meta) return "0/0";
    const shownEnd = (meta.page - 1) * meta.pageSize + rows.length;
    return `${shownEnd}/${meta.total}`;
  }, [meta, rows.length]);

  function scrollToComposer(): void {
    requestAnimationFrame(() => {
      document
        .getElementById("admin-activation-code-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openNewCode(): void {
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  useEffect(() => {
    if (!composerOpen || !composerScrollPending.current) return;
    composerScrollPending.current = false;
    scrollToComposer();
  }, [composerOpen]);

  async function disableCode(id: string): Promise<void> {
    if (
      !window.confirm(
        "تعطيل هذا الكود؟ لن يتمكن الطلاب من استخدامه بعد الآن.",
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await adminFetchJson(`/admin/activation-codes/${id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      await load();
    } catch (e) {
      window.alert(
        e instanceof AdminApiError ? e.message : "تعذّر التعطيل.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-heading">أكواد التفعيل</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            إنشاء أكواد للكورسات المنشورة وتتبّع الاستخدام.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs shadow-brand"
          onClick={() => {
            if (composerOpen) {
              setComposerOpen(false);
              return;
            }
            openNewCode();
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {composerOpen ? "إخفاء الإضافة" : "كود جديد"}
        </Button>
      </div>

      {composerOpen ? (
        <AdminActivationCodeComposer
          key="new"
          onCancel={() => setComposerOpen(false)}
          onSaved={() => {
            void load();
          }}
        />
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-3 py-2 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
            <span
              className="shrink-0 text-xs font-semibold tabular-nums text-[hsl(265_45%_42%)]"
              aria-live="polite"
            >
              {loading ? "…" : countLabel}
            </span>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary"
                aria-hidden
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث بعنوان الكورس أو الكود…"
                className="h-9 w-full rounded-full border border-border/70 bg-muted/20 pe-9 ps-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold transition",
                  statusFilter === ""
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
                )}
              >
                الكل
              </button>
              {(["ACTIVE", "DISABLED", "EXPIRED"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold transition",
                    statusFilter === key
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {STATUS_FILTER_LABEL[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={String(i)}
                className={cn(
                  "h-10 animate-pulse",
                  i % 2 === 1 ? "bg-muted/20" : "bg-card",
                )}
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            لا توجد أكواد مطابقة للبحث.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">الكود</th>
                  <th className="px-4 py-2 font-medium">الكورس</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                  <th className="px-4 py-2 font-medium">الاستخدام</th>
                  <th className="px-4 py-2 font-medium">ينتهي</th>
                  <th className="w-24 px-4 py-2 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-border/40 transition-colors",
                      index % 2 === 1 ? "bg-muted/25" : "bg-card",
                    )}
                  >
                    <td
                      className="px-4 py-2.5 align-middle font-mono text-[0.625rem]"
                      dir="ltr"
                    >
                      {row.maskedCode}
                    </td>
                    <td className="max-w-[200px] px-4 py-2.5 align-middle">
                      <span className="line-clamp-2 font-semibold text-heading">
                        {row.course.title}
                      </span>
                      <span className="mt-0.5 block text-[0.625rem] text-muted-foreground">
                        {row.course.pricingType === "PAID" ? "مدفوع" : "مجاني"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <Badge
                        variant={statusBadgeVariant(row.status)}
                        className="text-[0.625rem]"
                      >
                        {STATUS_AR[row.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 align-middle tabular-nums text-muted-foreground">
                      {row.usedCount} / {row.usageLimit}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-[0.625rem] text-muted-foreground">
                      {row.expiresAt
                        ? new Date(row.expiresAt).toLocaleDateString("ar-JO")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      {row.status === "ACTIVE" ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void disableCode(row.id)}
                          className="rounded-md bg-red-50 px-2 py-1 text-[0.6875rem] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === row.id ? "جاري…" : "تعطيل"}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-[0.6875rem] text-muted-foreground">
            <span>
              صفحة {meta.page} من {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={meta.page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-[0.6875rem] font-semibold text-heading transition hover:bg-muted/40 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-[0.6875rem] font-semibold text-heading transition hover:bg-muted/40 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
