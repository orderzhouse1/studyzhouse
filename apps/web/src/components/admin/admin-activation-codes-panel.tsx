"use client";

import { KeyRound, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

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

function statusVariant(
  s: Row["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "ACTIVE") return "success";
  if (s === "DISABLED") return "muted";
  return "warning";
}

export function AdminActivationCodesPanel(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | Row["status"]>("");
  const [busyId, setBusyId] = useState<string | null>(null);

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
      const json = await adminFetchJson<ListResponse>(
        `/admin/activation-codes?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحميل.");
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="المدفوعات لاحقًا"
        title="أكواد التفعيل"
        description="إنشاء أكواد للكورسات المنشورة وتتبّع الاستخدام دون تخزين النص الكامل."
        actions={
          <Button asChild className="rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600">
            <Link href="/admin/activation-codes/new">
              <Plus className="ms-1 h-4 w-4" aria-hidden />
              إنشاء كود جديد
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-card md:flex-row md:items-end md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-2xl ps-10"
            placeholder="بحث بعنوان الكورس…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm md:w-44"
          value={status || ""}
          onChange={(e) =>
            setStatus(
              e.target.value === ""
                ? ""
                : (e.target.value as Row["status"]),
            )
          }
        >
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="DISABLED">معطّل</option>
          <option value="EXPIRED">منتهٍ</option>
        </select>
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
            <KeyRound className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm font-medium">لا توجد أكواد بعد</p>
            <Button asChild className="rounded-xl bg-orange-500 text-white hover:bg-orange-600">
              <Link href="/admin/activation-codes/new">إنشاء أول كود</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">الكود</th>
                  <th className="px-4 py-3 text-start font-semibold">الكورس</th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-start font-semibold">الاستخدام</th>
                  <th className="px-4 py-3 text-start font-semibold">ينتهي</th>
                  <th className="px-4 py-3 text-start font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {r.maskedCode}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="line-clamp-2 font-medium leading-snug">
                        {r.course.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {r.course.pricingType === "PAID" ? "مدفوع" : "مجاني"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(r.status)}>
                        {STATUS_AR[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.usedCount} / {r.usageLimit}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.expiresAt
                        ? new Date(r.expiresAt).toLocaleDateString("ar-JO")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          disabled={busyId === r.id}
                          onClick={() => void disableCode(r.id)}
                        >
                          {busyId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "تعطيل"
                          )}
                        </Button>
                      ) : (
                        "—"
                      )}
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
              صفحة {meta.page} من {meta.totalPages}
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
