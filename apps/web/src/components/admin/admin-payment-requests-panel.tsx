"use client";

import { CreditCard, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

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

function statusVariant(
  s: Row["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "PENDING") return "warning";
  if (s === "APPROVED") return "success";
  return "muted";
}

export function AdminPaymentRequestsPanel(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | Row["status"]>("");

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
        `/admin/payment-requests?${qs}`,
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="المدفوعات"
        title="طلبات الدفع اليدوية"
        description="مراجعة مدفوعات CliQ المُبلَغ عنها من الطلاب — قبول الطلب ينشئ تسجيلًا في الكورس."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-2xl pe-10"
            placeholder="بحث: البريد، الاسم، المرجع…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "" | Row["status"])
          }
          className="h-10 rounded-2xl border border-input bg-background px-3 text-sm"
        >
          <option value="">كل الحالات</option>
          <option value="PENDING">قيد المراجعة</option>
          <option value="APPROVED">مقبول</option>
          <option value="REJECTED">مرفوض</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 text-sm text-red-900">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-dashed py-14 text-center shadow-none">
          <CardHeader>
            <CardTitle className="text-base">لا توجد طلبات</CardTitle>
            <CardDescription>
              ستظهر هنا طلبات الطلاب بعد إرسالهم لمرجع CliQ.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {rows.map((r) => (
              <Card
                key={r.id}
                className="rounded-3xl border-border shadow-card ring-1 ring-border/60"
              >
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(r.status)}>
                        {STATUS_AR[r.status]}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        {r.course.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.student.fullName} · {r.student.email}
                    </p>
                    <p className="text-xs" dir="ltr">
                      مرجع: {r.paymentReference ?? "—"} · مدفوع:{" "}
                      {r.paidAmount} {r.currency}
                      {r.coursePrice
                        ? ` · سعر الكورس: ${r.coursePrice}`
                        : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ar-JO")}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="shrink-0 rounded-2xl">
                    <Link href={`/admin/payment-requests/${r.id}`}>
                      <CreditCard className="me-2 h-4 w-4" aria-hidden />
                      مراجعة
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </Button>
              <span className="text-xs text-muted-foreground">
                صفحة {meta.page} من {meta.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page >= meta.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(meta.totalPages, p + 1))
                }
              >
                التالي
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
