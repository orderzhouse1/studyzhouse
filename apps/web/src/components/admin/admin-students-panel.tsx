"use client";

import { Loader2, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetchJson } from "@/lib/courses-client-api";

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

function statusVariant(
  s: StudentRow["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "ACTIVE") return "success";
  if (s === "PENDING") return "warning";
  if (s === "SUSPENDED") return "warning";
  return "muted";
}

export function AdminStudentsPanel(): React.ReactElement {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | StudentRow["status"]>("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "12");
    if (search.trim()) p.set("search", search.trim());
    if (status) p.set("status", status);
    return p.toString();
  }, [page, search, status]);

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
  }, [search, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="إدارة المنصة"
        title="الطلاب والتسجيلات"
        description="عرض الطلاب، إنشاء حسابات، وتسجيلهم يدويًا في الكورسات المنشورة."
        actions={
          <Button asChild className="rounded-xl shadow-brand">
            <Link href="/admin/students/new">
              <Plus className="ms-1 h-4 w-4" aria-hidden />
              طالب جديد
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-card md:flex-row md:items-end md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-2xl ps-10"
            placeholder="بحث بالاسم أو البريد…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث"
          />
        </div>
        <div className="flex flex-wrap gap-2 md:w-52">
          <label className="sr-only" htmlFor="student-status-filter">
            حالة الحساب
          </label>
          <select
            id="student-status-filter"
            className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            value={status || ""}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(v === "" ? "" : (v as StudentRow["status"]));
            }}
          >
            <option value="">كل الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">موقوف</option>
            <option value="DELETED">محذوف</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {error}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-3 rounded-xl"
            onClick={() => void load()}
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card ring-1 ring-border/60">
        {loading && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري التحميل…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">لا يوجد طلاب مطابقون</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              غيّر البحث أو أنشئ طالبًا جديدًا للبدء.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/admin/students/new">إنشاء طالب</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الطالب</th>
                  <th className="px-4 py-3 text-start font-semibold">البريد</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">التسجيلات</th>
                  <th className="px-4 py-3 text-start font-semibold">
                    متوسط التقدّم
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{r.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                      {r.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(r.status)}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.enrollmentsCount}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-primary">
                      {r.averageProgressPercent}%
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href={`/admin/students/${r.id}`}>التفاصيل</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              صفحة {meta.page} من {meta.totalPages} — إجمالي {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
