"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

export function SuperAdminAdminNewForm(): React.ReactElement {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useRandom, setUseRandom] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPw, setCreatedPw] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, string | undefined> = {
        fullName: fullName.trim(),
        email: email.trim(),
      };
      if (!useRandom && password.trim().length >= 8) {
        body.password = password.trim();
      }
      const json = await adminFetchJson<{
        success: true;
        data: {
          admin: { id: string };
          generatedPassword: string | null;
        };
      }>("/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCreatedId(json.data.admin.id);
      if (json.data.generatedPassword) {
        setCreatedPw(json.data.generatedPassword);
      } else {
        setCreatedPw(null);
      }
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "تعذّر الإنشاء.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (createdId) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageHeader
          title="تم إنشاء الأدمن"
          description="احفظ أي كلمة مرور ظهرت أدناه — لن تُعرض مرة أخرى."
        />
        {createdPw ? (
          <Card className="rounded-3xl border border-cyan-200/80 bg-cyan-50/90 ring-1 ring-cyan-200/70">
            <CardHeader>
              <CardTitle className="text-base text-cyan-950">
                كلمة المرور المؤقتة
              </CardTitle>
              <CardDescription className="text-cyan-900/85">
                انسخها الآن وأرسلها للأدمن عبر قناة آمنة. لن تظهر مرة أخرى بعد
                مغادرة الصفحة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className="break-all rounded-2xl bg-white px-4 py-3 text-center text-lg font-mono font-bold tracking-wide text-foreground ring-1 ring-cyan-200/60"
                dir="ltr"
              >
                {createdPw}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              تم الاعتماد على كلمة مرور أدخلتَها أنت — لا شيء للعرض هنا.
            </p>
          </Card>
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-primary">
            <Link href={`/super-admin/admins/${createdId}`}>فتح الملف</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/super-admin/admins">العودة للقائمة</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader
        eyebrow="أدمن جديد"
        title="إنشاء حساب أدمن"
        description="يُنشَأ بدور ADMIN فقط. لا يمكن إنشاء SUPER_ADMIN من هذه الشاشة."
      />

      <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
        <CardContent className="pt-6">
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fn">الاسم الكامل</Label>
              <Input
                id="fn"
                className="rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="em">البريد</Label>
              <Input
                id="em"
                type="email"
                dir="ltr"
                className="rounded-xl text-start"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Card className="rounded-2xl border border-cyan-200/70 bg-cyan-50/80">
              <CardContent className="space-y-3 pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useRandom}
                    onChange={(e) => setUseRandom(e.target.checked)}
                    className="rounded border-input"
                  />
                  توليد كلمة مرور عشوائية آمنة
                </label>
                {!useRandom ? (
                  <div className="space-y-2">
                    <Label htmlFor="pw">كلمة المرور (8 أحرف على الأقل)</Label>
                    <Input
                      id="pw"
                      type="password"
                      dir="ltr"
                      className="rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary"
              >
                {loading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                إنشاء الحساب
              </Button>
              <Button asChild type="button" variant="outline" className="rounded-xl">
                <Link href="/super-admin/admins">إلغاء</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
