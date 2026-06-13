"use client";

import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AdminApiError,
  fetchAuditLogDetail,
  fetchAuditLogs,
} from "@/lib/admin-audit-logs-api";
import { cn } from "@/lib/utils";
import type { AuditLogDetail, AuditLogListItem } from "@studyhouse/shared";

const SEVERITY_LABELS: Record<string, string> = {
  INFO: "معلومات",
  WARNING: "تحذير",
  CRITICAL: "حرج",
};

function AuditLogDetailDrawer({
  detail,
  onClose,
}: {
  detail: AuditLogDetail;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-heading">{detail.action}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(detail.createdAt).toLocaleString("ar-JO")}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">النوع</dt>
            <dd>{detail.entityType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">الأهمية</dt>
            <dd>{SEVERITY_LABELS[detail.severity] ?? detail.severity}</dd>
          </div>
          {detail.actor ? (
            <div>
              <dt className="text-muted-foreground">المنفّذ</dt>
              <dd>
                {detail.actor.fullName} ({detail.actor.email})
              </dd>
            </div>
          ) : null}
          {detail.beforeJson != null ? (
            <div>
              <dt className="text-muted-foreground">قبل</dt>
              <dd className="mt-1 overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono text-xs">
                {JSON.stringify(detail.beforeJson, null, 2)}
              </dd>
            </div>
          ) : null}
          {detail.afterJson != null ? (
            <div>
              <dt className="text-muted-foreground">بعد</dt>
              <dd className="mt-1 overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono text-xs">
                {JSON.stringify(detail.afterJson, null, 2)}
              </dd>
            </div>
          ) : null}
          {detail.metadata != null ? (
            <div>
              <dt className="text-muted-foreground">بيانات إضافية</dt>
              <dd className="mt-1 overflow-x-auto rounded-lg bg-muted/40 p-2 font-mono text-xs">
                {JSON.stringify(detail.metadata, null, 2)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

export function AdminAuditLogsPanel({
  apiBase,
  title = "سجل العمليات",
  description = "تتبّع الإجراءات الحساسة مع فلاتر متقدمة وتفاصيل before/after.",
}: {
  apiBase: "/admin/audit-logs" | "/super-admin/audit-logs";
  title?: string;
  description?: string;
}): React.ReactElement {
  const [rows, setRows] = useState<AuditLogListItem[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [actorId, setActorId] = useState("");
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    if (actionFilter.trim()) p.set("action", actionFilter.trim());
    if (entityTypeFilter.trim()) p.set("entityType", entityTypeFilter.trim());
    if (severityFilter) p.set("severity", severityFilter);
    if (actorId.trim().length >= 10) p.set("actorId", actorId.trim());
    return p.toString();
  }, [page, actionFilter, entityTypeFilter, severityFilter, actorId]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchAuditLogs(apiBase, qs);
      setRows(json.data.items);
      setMeta(json.meta);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحميل.");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [apiBase, qs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string): Promise<void> {
    setDetailLoading(true);
    try {
      const row = await fetchAuditLogDetail(apiBase, id);
      setDetail(row);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر تحميل التفاصيل.");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="الشفافية" title={title} description={description} />

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
          placeholder="نوع الكيان"
          className="max-w-[160px] rounded-2xl text-xs"
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
        />
        <select
          className="h-10 max-w-[140px] rounded-2xl border border-input bg-background px-3 text-xs"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">كل المستويات</option>
          <option value="INFO">معلومات</option>
          <option value="WARNING">تحذير</option>
          <option value="CRITICAL">حرج</option>
        </select>
        <Input
          placeholder="معرّف المنفّذ"
          dir="ltr"
          className="max-w-xs rounded-2xl font-mono text-xs"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

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
                className="cursor-pointer rounded-2xl border-border/80 bg-card shadow-sm transition hover:border-primary/30"
                onClick={() => void openDetail(r.id)}
              >
                <CardContent className="py-4 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold text-foreground">{r.action}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ar-JO")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{r.entityType}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        r.severity === "CRITICAL" && "bg-red-100 text-red-800",
                        r.severity === "WARNING" && "bg-amber-100 text-amber-900",
                        r.severity === "INFO" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {SEVERITY_LABELS[r.severity] ?? r.severity}
                    </span>
                    {r.actor ? <span>{r.actor.fullName}</span> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <span className="text-xs text-muted-foreground">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          ) : null}
        </>
      )}

      {detailLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : null}

      {detail ? (
        <AuditLogDetailDrawer detail={detail} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}
