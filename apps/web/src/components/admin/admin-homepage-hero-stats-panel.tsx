"use client";

import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import type { HomepageHeroStatAdminItem } from "@studyhouse/shared";

const arNumber = new Intl.NumberFormat("ar");

const METRIC_LABELS: Record<string, string> = {
  site_visits: "زيارات الموقع (من العدّاد)",
  registered_students: "الطلاب النشطون",
  available_courses: "الكورسات المنشورة",
};

function reorderItems(
  items: HomepageHeroStatAdminItem[],
  from: number,
  to: number,
): HomepageHeroStatAdminItem[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (!moved) return items;
  next.splice(to, 0, moved);
  return next.map((item, index) => ({ ...item, sortOrder: index }));
}

export function AdminHomepageHeroStatsPanel(): React.ReactElement {
  const [items, setItems] = useState<HomepageHeroStatAdminItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<{
        success: true;
        data: { items: HomepageHeroStatAdminItem[] };
      }>("/admin/homepage-hero-stats");
      setItems(json.data.items);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحميل.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (!items) return;
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const payload = {
        items: items.map((item, index) => ({
          metricKey: item.metricKey,
          label: item.label,
          visible: item.visible,
          sortOrder: index,
        })),
      };
      const json = await adminFetchJson<{
        success: true;
        data: { items: HomepageHeroStatAdminItem[] };
      }>("/admin/homepage-hero-stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setItems(json.data.items);
      setOk("تم حفظ إعدادات الإحصائيات.");
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !items) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="الصفحة الرئيسية"
        title="إحصائيات الهيرو"
        description="تحكّم بالتسميات والظهور والترتيب. القيم تُحسب تلقائيًا من قاعدة البيانات ولا يمكن تعديلها يدويًا."
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-emerald-700" role="status">
          {ok}
        </p>
      ) : null}

      <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>المقاييس</CardTitle>
          <CardDescription>
            القيم الحالية للمعاينة فقط — تتحدّث عند كل تحميل.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.metricKey}
              className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {METRIC_LABELS[item.metricKey] ?? item.metricKey}
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-heading">
                    {arNumber.format(item.value)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={index === 0}
                    onClick={() =>
                      setItems((prev) =>
                        prev ? reorderItems(prev, index, index - 1) : prev,
                      )
                    }
                    aria-label="تحريك لأعلى"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={index === items.length - 1}
                    onClick={() =>
                      setItems((prev) =>
                        prev ? reorderItems(prev, index, index + 1) : prev,
                      )
                    }
                    aria-label="تحريك لأسفل"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`label-${item.metricKey}`}>التسمية الظاهرة</Label>
                <Input
                  id={`label-${item.metricKey}`}
                  className="rounded-xl"
                  value={item.label}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev
                        ? prev.map((row) =>
                            row.metricKey === item.metricKey
                              ? { ...row, label: e.target.value }
                              : row,
                          )
                        : prev,
                    )
                  }
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                  checked={item.visible}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev
                        ? prev.map((row) =>
                            row.metricKey === item.metricKey
                              ? { ...row, visible: e.target.checked }
                              : row,
                          )
                        : prev,
                    )
                  }
                />
                <span>إظهار في الصفحة الرئيسية</span>
              </label>
            </div>
          ))}

          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
                جارٍ الحفظ…
              </>
            ) : (
              "حفظ التغييرات"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
