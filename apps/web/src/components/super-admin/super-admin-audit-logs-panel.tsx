"use client";

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type Row = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: null | { id: string; fullName: string; email: string };
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

export function SuperAdminAuditLogsPanel(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actorId, setActorId] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    if (actionFilter.trim()) p.set("action", actionFilter.trim());
    if (actorId.trim().length >= 10) p.set("actorId", actorId.trim());
    return p.toString();
  }, [page, actionFilter, actorId]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<ListResponse>(
        `/super-admin/audit-logs?${qs}`,
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="الشفافية"
        title="سجل العمليات"
        description="الإجراءات الحساسة تُخفى من البيانات الوصفية تلقائيًا."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="تصفية بالإجراء…"
            className="rounded-2xl pe-10"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
        <Input
          placeholder="معرّف المنفّذ (cuid)"
          dir="ltr"
          className="max-w-xs rounded-2xl font-mono text-xs"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-800">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {rows.map((r) => (
              <Card
                key={r.id}
                className="rounded-2xl border-border/80 bg-card shadow-sm"
              >
                <CardContent className="py-4 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-foreground">{r.action}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ar-JO")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    المنفّذ:{" "}
                    {r.actor
                      ? `${r.actor.fullName} (${r.actor.email})`
                      : "—"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {r.entityType}
                    {r.entityId ? ` · ${r.entityId}` : ""}
                  </p>
                  {r.metadata !== null &&
                  r.metadata !== undefined &&
                  typeof r.metadata === "object" &&
                  Object.keys(r.metadata as object).length > 0 ? (
                    <pre
                      className="mt-2 max-h-28 overflow-auto rounded-lg bg-muted/50 p-2 text-[10px] leading-relaxed"
                      dir="ltr"
                    >
                      {JSON.stringify(r.metadata, null, 2)}
                    </pre>
                  ) : null}
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
