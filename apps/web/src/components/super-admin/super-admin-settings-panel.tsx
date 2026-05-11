"use client";

import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type Settings = {
  platformName: string;
  supportEmail: string;
  cliqAlias: string;
  cliqInstructions: string;
  allowStudentSignup: boolean;
  maintenanceMode: boolean;
};

export function SuperAdminSettingsPanel(): React.ReactElement {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<{ success: true; data: { settings: Settings } }>(
        "/super-admin/settings",
      );
      setSettings(json.data.settings);
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
    if (!settings) return;
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const json = await adminFetchJson<{
        success: true;
        data: { settings: Settings };
      }>("/super-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSettings(json.data.settings);
      setOk("تم حفظ الإعدادات.");
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="المنصة"
        title="إعدادات عامة"
        description="تُخزَّن في قاعدة البيانات ويمكن ربطها لاحقًا بصفحات الدفع والطلاب."
      />

      <Card className="rounded-3xl border border-cyan-200/70 bg-cyan-50/80 ring-1 ring-cyan-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-950">تلميح</CardTitle>
          <CardDescription className="text-cyan-900/85">
            حقول CliQ تُستخدم كمرجع للطلاب أثناء طلب التفعيل اليدوي — لا يوجد اتصال
            بنكي تلقائي.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="pn">اسم المنصة</Label>
            <Input
              id="pn"
              className="rounded-xl"
              value={settings.platformName}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, platformName: e.target.value } : s,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="se">بريد الدعم</Label>
            <Input
              id="se"
              type="email"
              dir="ltr"
              className="rounded-xl text-start"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, supportEmail: e.target.value } : s,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca">اسم / معرّف CliQ للدفع</Label>
            <Input
              id="ca"
              dir="ltr"
              className="rounded-xl"
              value={settings.cliqAlias}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, cliqAlias: e.target.value } : s,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">تعليمات الدفع (CliQ)</Label>
            <Textarea
              id="ci"
              className="min-h-[100px] rounded-xl"
              value={settings.cliqInstructions}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, cliqInstructions: e.target.value } : s,
                )
              }
              placeholder="مثال: أرسل المبلغ إلى المعرف … مع ذكر رقم الطالب."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allowStudentSignup}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, allowStudentSignup: e.target.checked } : s,
                )
              }
              className="rounded border-input"
            />
            السماح بتسجيل الطلاب الجدد (علَم للمراحل القادمة)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, maintenanceMode: e.target.checked } : s,
                )
              }
              className="rounded border-input"
            />
            وضع الصيانة (علَم للمراحل القادمة)
          </label>

          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          {ok ? (
            <p className="text-sm font-medium text-emerald-800">{ok}</p>
          ) : null}

          <Button
            type="button"
            className="rounded-xl bg-primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
