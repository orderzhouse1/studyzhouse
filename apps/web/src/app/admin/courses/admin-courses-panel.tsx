"use client";

import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetchJson } from "@/lib/courses-client-api";

type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
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

function statusVariant(
  s: AdminCourseRow["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "PUBLISHED") return "success";
  if (s === "ARCHIVED") return "warning";
  return "muted";
}

export function AdminCoursesPanel(): React.ReactElement {
  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | AdminCourseRow["status"]>("");
  const [pricing, setPricing] = useState<"" | "FREE" | "PAID">("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "12");
    if (search.trim()) p.set("search", search.trim());
    if (status) p.set("status", status);
    if (pricing) p.set("pricingType", pricing);
    return p.toString();
  }, [page, pricing, search, status]);

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
  }, [search, status, pricing]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary">إدارة الكورسات</p>
          <h2 className="text-2xl font-semibold tracking-tight">قائمة ذكية وهادئة</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            بحث لحظي، فلاتر حالة وتسعير، وتصفح صفحات — بدون شعور &quot;لوحة رمادية&quot;.
          </p>
        </div>
        <Button
          asChild
          className="rounded-xl px-6 py-6 text-base shadow-sm [&>a]:inline-flex [&>a]:items-center [&>a]:gap-2"
        >
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4" aria-hidden />
            كورس جديد
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm md:grid-cols-[1.3fr_0.7fr_0.7fr] md:items-end">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="q">
            بحث
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="عنوان أو معرّف…"
              className="rounded-xl pr-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="st">
            الحالة
          </label>
          <select
            id="st"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
            value={status}
            onChange={(e) =>
              setStatus((e.target.value || "") as typeof status)
            }
          >
            <option value="">الكل</option>
            <option value="DRAFT">مسودة</option>
            <option value="PUBLISHED">منشور</option>
            <option value="ARCHIVED">مؤرشف</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="pr">
            التسعير
          </label>
          <select
            id="pr"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
            value={pricing}
            onChange={(e) =>
              setPricing((e.target.value || "") as typeof pricing)
            }
          >
            <option value="">الكل</option>
            <option value="FREE">مجاني</option>
            <option value="PAID">مدفوع</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={String(i)}
                className="h-14 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Filter className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              لا توجد نتائج ضمن المعايير الحالية
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              غيّر البحث أو أزل الفلاتر، أو أنشئ كورسًا جديدًا.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-right text-xs text-muted-foreground">
                  <th className="px-6 py-4 font-medium">الكورس</th>
                  <th className="px-6 py-4 font-medium">التصنيف</th>
                  <th className="px-6 py-4 font-medium">التسعير</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">آخر تحديث</th>
                  <th className="px-6 py-4 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/15"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{row.title}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          /{row.slug}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-muted-foreground">
                      {row.category?.name ?? "—"}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className="font-medium text-foreground">
                        {row.pricingType === "FREE"
                          ? "مجاني"
                          : `${row.priceAmount ?? "—"} ${row.currency}`}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <Badge variant={statusVariant(row.status)}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 align-top text-muted-foreground">
                      {new Date(row.updatedAt).toLocaleString("ar")}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href={`/admin/courses/${row.id}`}>تعديل</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
          <span>
            صفحة {meta.page} من {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
