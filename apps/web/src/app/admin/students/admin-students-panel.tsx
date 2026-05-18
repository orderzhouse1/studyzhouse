"use client";

import { Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminStudentComposer } from "@/components/admin/students/admin-student-composer";
import { Button } from "@/components/ui/button";
import { adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type StudentRow = {
  id: string;
  fullName: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";
  createdAt: string;
  enrollmentsCount: number;
  averageProgressPercent: number;
};

type ListResponse = {
  success: true;
  data: { items: StudentRow[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const STATUS_LABEL: Record<StudentRow["status"], string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار التفعيل",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

type StatusFilter = "" | StudentRow["status"];

const STATUS_FILTER_LABEL: Record<Exclude<StatusFilter, "">, string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

export function AdminStudentsPanel(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialEditId = searchParams.get("edit");
  const initialNew = searchParams.get("new") === "1";

  const [rows, setRows] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
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
      const json = await adminFetchJson<ListResponse>(`/admin/students?${qs}`);
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل الطلاب.");
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
    if (initialEditId) {
      setEditingStudentId(initialEditId);
      setComposerOpen(true);
      composerScrollPending.current = true;
    } else if (initialNew) {
      setEditingStudentId(null);
      setComposerOpen(true);
      composerScrollPending.current = true;
    }
  }, [initialEditId, initialNew]);

  const countLabel = useMemo(() => {
    if (!meta) return "0/0";
    const shownEnd = (meta.page - 1) * meta.pageSize + rows.length;
    return `${shownEnd}/${meta.total}`;
  }, [meta, rows.length]);

  function scrollToComposer(): void {
    requestAnimationFrame(() => {
      document
        .getElementById("admin-student-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openEditStudent(studentId: string): void {
    setEditingStudentId(studentId);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  function openNewStudent(): void {
    setEditingStudentId(null);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  useEffect(() => {
    if (!composerOpen || !composerScrollPending.current) return;
    composerScrollPending.current = false;
    scrollToComposer();
  }, [composerOpen, editingStudentId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-heading">إدارة الطلاب</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            قائمة الطلاب — بحث سريع وإجراءات مباشرة.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs shadow-brand"
          onClick={() => {
            if (composerOpen && !editingStudentId) {
              setComposerOpen(false);
              return;
            }
            openNewStudent();
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {composerOpen && !editingStudentId ? "إخفاء الإضافة" : "طالب جديد"}
        </Button>
      </div>

      {composerOpen ? (
        <AdminStudentComposer
          key={editingStudentId ?? "new"}
          editStudentId={editingStudentId}
          onCancel={() => {
            setComposerOpen(false);
            setEditingStudentId(null);
          }}
          onStartNew={() => setEditingStudentId(null)}
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
                placeholder="ابحث بالاسم أو البريد أو الحالة…"
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
              {(
                ["ACTIVE", "PENDING", "SUSPENDED", "DELETED"] as const
              ).map((key) => (
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
            لا يوجد طلاب مطابقون للبحث.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">البريد</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                  <th className="px-4 py-2 font-medium">التسجيلات</th>
                  <th className="px-4 py-2 font-medium">التقدّم</th>
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
                      editingStudentId === row.id &&
                        "bg-primary/[0.06] ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openEditStudent(row.id)}
                        className="text-right font-semibold text-heading transition hover:text-primary"
                      >
                        {row.fullName}
                      </button>
                    </td>
                    <td
                      className="px-4 py-2.5 align-middle text-muted-foreground"
                      dir="ltr"
                    >
                      {row.email}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle tabular-nums text-muted-foreground">
                      {row.enrollmentsCount}
                    </td>
                    <td className="px-4 py-2.5 align-middle tabular-nums font-semibold text-primary">
                      {row.averageProgressPercent}%
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openEditStudent(row.id)}
                        className="text-[0.6875rem] font-semibold text-primary hover:underline"
                      >
                        تعديل
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
