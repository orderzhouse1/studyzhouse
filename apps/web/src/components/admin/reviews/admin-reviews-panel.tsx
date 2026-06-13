"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AdminApiError,
  deleteAdminReview,
  fetchAdminReviews,
  patchAdminReviewStatus,
} from "@/lib/course-reviews-api";
import { cn } from "@/lib/utils";
import type { AdminCourseReviewItem } from "@studyhouse/shared";

const STATUS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  PUBLISHED: "منشور",
  HIDDEN: "مخفي",
};

export function AdminReviewsPanel(): React.ReactElement {
  const [rows, setRows] = useState<AdminCourseReviewItem[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    totalPages: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", "20");
    if (statusFilter) p.set("status", statusFilter);
    return p.toString();
  }, [page, statusFilter]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchAdminReviews(qs);
      setRows(json.data.items);
      setMeta({ page: json.meta.page, totalPages: json.meta.totalPages });
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحميل.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(
    reviewId: string,
    status: "PENDING" | "PUBLISHED" | "HIDDEN",
  ): Promise<void> {
    setBusyId(reviewId);
    try {
      await patchAdminReviewStatus(reviewId, status);
      await load();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحديث.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(reviewId: string): Promise<void> {
    setBusyId(reviewId);
    try {
      await deleteAdminReview(reviewId);
      await load();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر الحذف.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="المجتمع"
        title="مراجعات الكورسات"
        description="راجع التقييمات قبل نشرها للعامة. الافتراضي: قيد المراجعة."
      />

      <div className="flex flex-wrap gap-2">
        {(["PENDING", "PUBLISHED", "HIDDEN"] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
          >
            {STATUS_AR[s]}
          </Button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="rounded-2xl">
              <CardContent className="space-y-3 py-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-bold text-heading">{r.course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.student.fullName} · {r.rating}/5 ·{" "}
                      {STATUS_AR[r.status]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.status !== "PUBLISHED" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void setStatus(r.id, "PUBLISHED")}
                      >
                        نشر
                      </Button>
                    ) : null}
                    {r.status !== "HIDDEN" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void setStatus(r.id, "HIDDEN")}
                      >
                        إخفاء
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-700"
                      disabled={busyId === r.id}
                      onClick={() => void remove(r.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
                {r.title ? <p className="font-medium">{r.title}</p> : null}
                {r.comment ? (
                  <p className={cn("text-muted-foreground")}>{r.comment}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-xs self-center text-muted-foreground">
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
    </div>
  );
}
