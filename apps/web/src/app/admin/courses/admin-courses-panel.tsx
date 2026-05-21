"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminCourseComposer } from "@/components/admin/courses/admin-course-composer";
import { Button } from "@/components/ui/button";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pricingType: "FREE" | "PAID";
  category: null | { id: string; name: string; slug: string };
  updatedAt: string;
};

type ListResponse = {
  success: true;
  data: { items: AdminCourseRow[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const STATUS_LABEL: Record<AdminCourseRow["status"], string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

export function AdminCoursesPanel(): React.ReactElement {
  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const composerScrollPending = useRef(false);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, search]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(`/admin/courses?${qs}`);
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل الكورسات.");
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
  }, [search]);

  const countLabel = useMemo(() => {
    if (!meta) return "0/0";
    const shownEnd = (meta.page - 1) * meta.pageSize + rows.length;
    return `${shownEnd}/${meta.total}`;
  }, [meta, rows.length]);

  function scrollToComposer(): void {
    requestAnimationFrame(() => {
      document
        .getElementById("admin-course-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openEditCourse(courseId: string): void {
    setEditingCourseId(courseId);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  function openNewCourse(): void {
    setEditingCourseId(null);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  useEffect(() => {
    if (!composerOpen || !composerScrollPending.current) return;
    composerScrollPending.current = false;
    scrollToComposer();
  }, [composerOpen, editingCourseId]);

  async function handleArchive(course: AdminCourseRow): Promise<void> {
    if (
      !window.confirm(
        `أرشفة الكورس «${course.title}»؟ لن يظهر في الكتالوج بعد الأرشفة.`,
      )
    ) {
      return;
    }
    setArchivingId(course.id);
    try {
      await adminFetchJson(`/admin/courses/${course.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      await load();
    } catch (e) {
      const msg =
        e instanceof AdminApiError ? e.message : "تعذّر أرشفة الكورس.";
      window.alert(msg);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-heading">إدارة الكورسات</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            قائمة كورسات المنصة — بحث سريع وإجراءات مباشرة.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs shadow-brand"
          onClick={() => {
            if (composerOpen && !editingCourseId) {
              setComposerOpen(false);
              return;
            }
            openNewCourse();
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {composerOpen && !editingCourseId ? "إخفاء الإضافة" : "كورس جديد"}
        </Button>
      </div>

      {composerOpen ? (
        <AdminCourseComposer
          key={editingCourseId ?? "new"}
          editCourseId={editingCourseId}
          onCancel={() => {
            setComposerOpen(false);
            setEditingCourseId(null);
          }}
          onStartNew={() => setEditingCourseId(null)}
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
          <div className="flex items-center gap-2.5">
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
                placeholder="ابحث بعنوان الكورس أو التصنيف أو الحالة…"
                className="h-9 w-full rounded-full border border-border/70 bg-muted/20 pe-9 ps-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
              />
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
            لا توجد كورسات مطابقة للبحث.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">العنوان</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                  <th className="px-4 py-2 font-medium">التصنيف</th>
                  <th className="w-28 px-4 py-2 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-border/40 transition-colors",
                      index % 2 === 1 ? "bg-muted/25" : "bg-card",
                      editingCourseId === row.id &&
                        "bg-primary/[0.06] ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openEditCourse(row.id)}
                        className="text-right font-semibold text-heading transition hover:text-primary"
                      >
                        {row.title}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-muted-foreground">
                      {row.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCourse(row.id)}
                          className="text-[0.6875rem] font-semibold text-primary hover:underline"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          disabled={archivingId === row.id || row.status === "ARCHIVED"}
                          onClick={() => void handleArchive(row)}
                          className="rounded-md bg-red-50 px-2 py-1 text-[0.6875rem] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {archivingId === row.id
                            ? "جاري…"
                            : row.status === "ARCHIVED"
                              ? "مؤرشف"
                              : "حذف"}
                        </button>
                      </div>
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
