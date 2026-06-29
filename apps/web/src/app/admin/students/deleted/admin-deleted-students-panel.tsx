"use client";

import { Loader2, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

type StudentRow = {
  id: string;
  fullName: string;
  email: string;
  status: "DELETED";
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

export function AdminDeletedStudentsPanel(): React.ReactElement {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    p.set("status", "DELETED");
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [page, search]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(`/admin/students?${qs}`);
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل الحسابات.");
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

  async function restoreStudent(studentId: string, fullName: string): Promise<void> {
    if (
      !window.confirm(
        `استعادة حساب «${fullName}»؟ سيتمكن الطالب من تسجيل الدخول مجددًا.`,
      )
    ) {
      return;
    }
    setRestoringId(studentId);
    try {
      await adminFetchJson(`/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      await load();
    } catch (e) {
      window.alert(
        e instanceof AdminApiError ? e.message : "تعذّر استعادة الحساب.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-heading">الحسابات المحذوفة</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            حسابات الطلاب المعطّلة (حذف ناعم). يمكن استعادتها دون فقدان
            التسجيلات أو التقدّم.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/students">كل الطلاب</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-3">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="بحث بالاسم أو البريد…"
              className="h-8 w-full rounded-md border border-border bg-background ps-8 pe-2.5 text-xs"
            />
          </div>
        </div>

        {error ? (
          <p className="px-4 py-6 text-center text-xs text-destructive">{error}</p>
        ) : loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            لا توجد حسابات محذوفة حاليًا.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="text-right text-[0.6875rem] font-medium text-muted-foreground">
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">البريد</th>
                  <th className="px-4 py-2 font-medium">التسجيلات</th>
                  <th className="w-32 px-4 py-2 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-t border-border/40",
                      index % 2 === 1 ? "bg-muted/25" : "bg-card",
                    )}
                  >
                    <td className="px-4 py-2.5 font-semibold text-heading">
                      {row.fullName}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground" dir="ltr">
                      {row.email}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.enrollmentsCount}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-[0.6875rem]"
                        disabled={restoringId === row.id}
                        onClick={() => void restoreStudent(row.id, row.fullName)}
                      >
                        {restoringId === row.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                        ) : (
                          <RotateCcw className="h-3 w-3" aria-hidden />
                        )}
                        استعادة الحساب
                      </Button>
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
                className="rounded-md border border-border/70 bg-card px-2.5 py-1 font-semibold text-heading transition hover:bg-muted/40 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border/70 bg-card px-2.5 py-1 font-semibold text-heading transition hover:bg-muted/40 disabled:opacity-50"
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
