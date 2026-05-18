"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPaymentRequestComposer } from "@/components/admin/payment-requests/admin-payment-request-composer";
import { adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  student: { id: string; fullName: string; email: string };
  course: { id: string; title: string; slug: string };
  paidAmount: string;
  coursePrice: string | null;
  currency: string;
  paymentReference: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

type StatusFilter = "" | Row["status"];

const STATUS_FILTER_LABEL: Record<Exclude<StatusFilter, "">, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

export function AdminPaymentRequestsPanel(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialEditId = searchParams.get("edit");

  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
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
        `/admin/payment-requests?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل طلبات الدفع.");
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
    if (didApplyUrlState.current || !initialEditId) return;
    didApplyUrlState.current = true;
    setReviewingId(initialEditId);
  }, [initialEditId]);

  const countLabel = useMemo(() => {
    if (!meta) return "0/0";
    const shownEnd = (meta.page - 1) * meta.pageSize + rows.length;
    return `${shownEnd}/${meta.total}`;
  }, [meta, rows.length]);

  function openReview(requestId: string): void {
    setReviewingId(requestId);
  }

  function closeComposer(): void {
    setReviewingId(null);
  }

  return (
    <div className="space-y-3">
      <div>
          <h1 className="text-base font-bold text-heading">طلبات الدفع</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            مراجعة مدفوعات CliQ — قبول الطلب ينشئ تسجيلًا في الكورس.
          </p>
      </div>

      {reviewingId ? (
        <AdminPaymentRequestComposer
          key={reviewingId}
          open
          paymentRequestId={reviewingId}
          onCancel={closeComposer}
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
                placeholder="ابحث بالبريد، الاسم، المرجع، أو الكورس…"
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
              {(["PENDING", "APPROVED", "REJECTED"] as const).map((key) => (
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
            لا توجد طلبات مطابقة للبحث.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">الكورس</th>
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                  <th className="px-4 py-2 font-medium">المبلغ</th>
                  <th className="px-4 py-2 font-medium">المرجع</th>
                  <th className="px-4 py-2 font-medium">التاريخ</th>
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
                      reviewingId === row.id &&
                        "bg-primary/[0.06] ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openReview(row.id)}
                        className="text-right font-semibold text-heading transition hover:text-primary"
                      >
                        {row.course.title}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <p className="font-medium text-heading">
                        {row.student.fullName}
                      </p>
                      <p
                        className="text-[0.625rem] text-muted-foreground"
                        dir="ltr"
                      >
                        {row.student.email}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        {STATUS_AR[row.status]}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 align-middle tabular-nums text-muted-foreground"
                      dir="ltr"
                    >
                      {row.paidAmount} {row.currency}
                    </td>
                    <td
                      className="max-w-[8rem] truncate px-4 py-2.5 align-middle font-mono text-[0.625rem] text-muted-foreground"
                      dir="ltr"
                      title={row.paymentReference ?? undefined}
                    >
                      {row.paymentReference ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-[0.625rem] text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString("ar-JO", {
                        dateStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openReview(row.id)}
                        className="text-[0.6875rem] font-semibold text-primary hover:underline"
                      >
                        مراجعة
                      </button>
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
