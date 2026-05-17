"use client";

import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AdminCategoryComposer,
  type CategoryComposerRow,
} from "@/components/admin/categories/admin-category-composer";
import { Button } from "@/components/ui/button";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type CategoryRow = CategoryComposerRow & {
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  success: true;
  data: { items: CategoryRow[] };
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type Scope = "all" | "active" | "archived";

const SCOPE_LABEL: Record<Scope, string> = {
  all: "الكل",
  active: "نشط",
  archived: "مؤرشف",
};

export function AdminCategoriesPanel(): React.ReactElement {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const composerScrollPending = useRef(false);

  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<Scope>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    p.set("scope", scope);
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, scope, search]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(
        `/admin/categories?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل التصنيفات.");
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
  }, [search, scope]);

  const countLabel = useMemo(() => {
    if (!meta) return "0/0";
    const shownEnd = (meta.page - 1) * meta.pageSize + rows.length;
    return `${shownEnd}/${meta.total}`;
  }, [meta, rows.length]);

  function scrollToComposer(): void {
    requestAnimationFrame(() => {
      document
        .getElementById("admin-category-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openEditCategory(row: CategoryRow): void {
    setEditingCategory(row);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  function openNewCategory(): void {
    setEditingCategory(null);
    setComposerOpen(true);
    composerScrollPending.current = true;
  }

  useEffect(() => {
    if (!composerOpen || !composerScrollPending.current) return;
    composerScrollPending.current = false;
    scrollToComposer();
  }, [composerOpen, editingCategory?.id]);

  async function handleArchive(row: CategoryRow): Promise<void> {
    if (row.archivedAt) return;
    if (
      !window.confirm(
        `أرشفة التصنيف «${row.name}»؟ لن يظهر في القوائم العامة للكورسات الجديدة.`,
      )
    ) {
      return;
    }
    setArchivingId(row.id);
    try {
      await adminFetchJson(`/admin/categories/${row.id}`, {
        method: "DELETE",
      });
      if (editingCategory?.id === row.id) {
        setEditingCategory(null);
        setComposerOpen(false);
      }
      await load();
    } catch (e) {
      const msg =
        e instanceof AdminApiError ? e.message : "تعذّر أرشفة التصنيف.";
      window.alert(msg);
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-heading">إدارة التصنيفات</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            قائمة التصنيفات — بحث سريع وإجراءات مباشرة.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs shadow-brand"
          onClick={() => {
            if (composerOpen && !editingCategory) {
              setComposerOpen(false);
              return;
            }
            openNewCategory();
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {composerOpen && !editingCategory ? "إخفاء الإضافة" : "تصنيف جديد"}
        </Button>
      </div>

      {composerOpen ? (
        <AdminCategoryComposer
          key={editingCategory?.id ?? "new"}
          editCategory={editingCategory}
          onCancel={() => {
            setComposerOpen(false);
            setEditingCategory(null);
          }}
          onStartNew={() => setEditingCategory(null)}
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
                placeholder="ابحث بالاسم أو المعرّف أو الوصف…"
                className="h-9 w-full rounded-full border border-border/70 bg-muted/20 pe-9 ps-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-1">
              {(["all", "active", "archived"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScope(key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold transition",
                    scope === key
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {SCOPE_LABEL[key]}
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
            لا توجد تصنيفات مطابقة للبحث.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">الاسم</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                  <th className="px-4 py-2 font-medium">المعرّف</th>
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
                      editingCategory?.id === row.id &&
                        "bg-primary/[0.06] ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={() => openEditCategory(row)}
                        disabled={Boolean(row.archivedAt)}
                        className="text-right font-semibold text-heading transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        {row.archivedAt ? "مؤرشف" : "نشط"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 align-middle text-muted-foreground"
                      dir="ltr"
                    >
                      {row.slug}
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={Boolean(row.archivedAt)}
                          onClick={() => openEditCategory(row)}
                          className="text-[0.6875rem] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          disabled={archivingId === row.id || Boolean(row.archivedAt)}
                          onClick={() => void handleArchive(row)}
                          className="rounded-md bg-red-50 px-2 py-1 text-[0.6875rem] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {archivingId === row.id
                            ? "جاري…"
                            : row.archivedAt
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
