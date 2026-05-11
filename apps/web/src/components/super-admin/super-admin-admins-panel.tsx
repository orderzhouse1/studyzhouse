"use client";

import { Loader2, Plus, Search, ShieldOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type Row = {
  id: string;
  fullName: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
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

const STATUS_AR: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

export function SuperAdminAdminsPanel(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "SUSPENDED">("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "15");
    if (search.trim()) p.set("search", search.trim());
    if (status) p.set("status", status);
    return p.toString();
  }, [page, search, status]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(
        `/super-admin/admins?${qs}`,
      );
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحميل.");
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
    const t = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  async function disableAdmin(id: string): Promise<void> {
    setBusyId(id);
    try {
      await adminFetchJson(`/super-admin/admins/${id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التعطيل.");
    } finally {
      setBusyId(null);
    }
  }

  async function enableAdmin(id: string): Promise<void> {
    setBusyId(id);
    try {
      await adminFetchJson(`/super-admin/admins/${id}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التفعيل.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الفريق"
        title="أدمنز المحتوى"
        description="إنشاء وإدارة حسابات الأدمن (ADMIN) فقط — دور المالك منفصل."
        actions={
          <Button asChild className="rounded-2xl bg-primary shadow-brand">
            <Link href="/super-admin/admins/new">
              <Plus className="me-2 h-4 w-4" aria-hidden />
              أدمن جديد
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو البريد…"
            className="rounded-2xl pe-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "" | "ACTIVE" | "SUSPENDED")
          }
          className="h-10 rounded-2xl border border-input bg-background px-3 text-sm"
        >
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="SUSPENDED">موقوف</option>
        </select>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-dashed py-12 text-center">
          <CardContent>
            <p className="text-sm text-muted-foreground">لا يوجد أدمن مطابق.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card
                key={r.id}
                className="rounded-2xl border-border shadow-sm ring-1 ring-border/50"
              >
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{r.fullName}</span>
                      <Badge
                        variant={
                          r.status === "ACTIVE" ? "success" : "muted"
                        }
                      >
                        {STATUS_AR[r.status] ?? r.status}
                      </Badge>
                    </div>
                    <p dir="ltr" className="text-xs text-muted-foreground">
                      {r.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      أُنشئ {new Date(r.createdAt).toLocaleString("ar-JO")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href={`/super-admin/admins/${r.id}`}>تفاصيل</Link>
                    </Button>
                    {r.status === "ACTIVE" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-amber-950 border-amber-200 bg-amber-50"
                        disabled={busyId === r.id}
                        onClick={() => void disableAdmin(r.id)}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldOff className="me-2 h-4 w-4" aria-hidden />
                        )}
                        تعطيل
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl bg-primary text-primary-foreground"
                        disabled={busyId === r.id}
                        onClick={() => void enableAdmin(r.id)}
                      >
                        {busyId === r.id ? (
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="me-2 h-4 w-4" aria-hidden />
                        )}
                        تفعيل
                      </Button>
                    )}
                  </div>
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
