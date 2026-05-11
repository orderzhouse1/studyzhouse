"use client";

import { ArrowRight, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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

type DetailResponse = {
  success: true;
  data: {
    admin: {
      id: string;
      fullName: string;
      email: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      jobTitle: string | null;
    };
  };
};

const STATUS_AR: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  DELETED: "محذوف",
};

export function SuperAdminAdminDetailPanel({
  adminId,
}: {
  adminId: string;
}): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse["data"]["admin"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<DetailResponse>(
        `/super-admin/admins/${adminId}`,
      );
      setData(json.data.admin);
      setFullName(json.data.admin.fullName);
      setStatus(
        json.data.admin.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      );
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "غير موجود.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(): Promise<void> {
    setSaving(true);
    setBanner(null);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        status,
      };
      if (newPassword.trim().length >= 8) {
        body.newPassword = newPassword.trim();
      }
      await adminFetchJson(`/super-admin/admins/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setBanner("تم حفظ التغييرات.");
      setNewPassword("");
      await load();
    } catch (e) {
      setBanner(
        e instanceof AdminApiError ? e.message : "تعذّر الحفظ.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function disableA(): Promise<void> {
    setBusy(true);
    setBanner(null);
    try {
      await adminFetchJson(`/super-admin/admins/${adminId}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setBanner("تم تعطيل الحساب.");
      await load();
    } catch (e) {
      setBanner(
        e instanceof AdminApiError ? e.message : "تعذّر التعطيل.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enableA(): Promise<void> {
    setBusy(true);
    setBanner(null);
    try {
      await adminFetchJson(`/super-admin/admins/${adminId}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setBanner("تم تفعيل الحساب.");
      await load();
    } catch (e) {
      setBanner(
        e instanceof AdminApiError ? e.message : "تعذّر التفعيل.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-800">{error}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/super-admin/admins">رجوع</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={data.fullName}
        description="ملف أدمن المحتوى"
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => router.push("/super-admin/admins")}
          >
            <ArrowRight className="me-2 h-4 w-4 rotate-180" aria-hidden />
            القائمة
          </Button>
        }
      />

      {banner ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-950">
          {banner}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={data.status === "ACTIVE" ? "success" : "muted"}>
          {STATUS_AR[data.status] ?? data.status}
        </Badge>
        <span dir="ltr" className="text-xs text-muted-foreground">
          {data.email}
        </span>
      </div>

      <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-base">تعديل البيانات</CardTitle>
          <CardDescription>الاسم، الحالة، وإعادة تعيين كلمة المرور.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="fn">الاسم</Label>
            <Input
              id="fn"
              className="rounded-xl"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st">الحالة</Label>
            <select
              id="st"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ACTIVE" | "SUSPENDED")
              }
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="ACTIVE">نشط</option>
              <option value="SUSPENDED">موقوف</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="np">كلمة مرور جديدة (اختياري)</Label>
            <Input
              id="np"
              type="password"
              dir="ltr"
              className="rounded-xl"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="اتركها فارغة إن لم تتغيّر"
              minLength={8}
            />
          </div>
          <Button
            type="button"
            className="rounded-xl bg-primary"
            disabled={saving}
            onClick={() => void saveProfile()}
          >
            {saving ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            حفظ
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-amber-200/80 bg-amber-50/50 ring-1 ring-amber-200/60">
        <CardHeader>
          <CardTitle className="text-base">تعطيل سريع</CardTitle>
          <CardDescription>
            لا يمكنك تعطيل حسابك بنفسك من الخادم — استخدم أدمنًا آخر إن لزم.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {data.status === "ACTIVE" ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-amber-300 text-amber-950"
              disabled={busy}
              onClick={() => void disableA()}
            >
              {busy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldOff className="me-2 h-4 w-4" aria-hidden />
              )}
              تعطيل الحساب
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-xl bg-primary"
              disabled={busy}
              onClick={() => void enableA()}
            >
              {busy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="me-2 h-4 w-4" aria-hidden />
              )}
              تفعيل الحساب
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
