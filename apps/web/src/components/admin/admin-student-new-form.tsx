"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type CreateResponse = {
  success: true;
  data: {
    student: { id: string };
    generatedPassword?: string;
  };
};

export function AdminStudentNewForm(): React.ReactElement {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        status,
      };
      if (password.trim().length >= 8) {
        body.password = password.trim();
      }
      const json = await adminFetchJson<CreateResponse>(`/admin/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (json.data.generatedPassword) {
        window.alert(
          `تم توليد كلمة مرور مؤقتة — احفظها الآن:\n\n${json.data.generatedPassword}`,
        );
      }
      router.push(`/admin/students/${json.data.student.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("تعذّر إنشاء الطالب.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="إضافة"
        title="طالب جديد"
        description="يُنشَأ بحساب دور «طالب» فقط. يمكن ترك كلمة المرور فارغة لتوليد كلمة تلقائيًا تُعرض مرة واحدة."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/students">رجوع للقائمة</Link>
          </Button>
        }
      />

      <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-lg">البيانات الأساسية</CardTitle>
          <CardDescription>جميع الحقول مطلوبة ما عدا كلمة المرور.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="sn-name">الاسم الكامل</Label>
              <Input
                id="sn-name"
                className="rounded-2xl"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-email">البريد الإلكتروني</Label>
              <Input
                id="sn-email"
                dir="ltr"
                type="email"
                className="rounded-2xl text-left"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-pw">كلمة المرور (اختياري)</Label>
              <Input
                id="sn-pw"
                dir="ltr"
                type="password"
                autoComplete="new-password"
                className="rounded-2xl text-left"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركه فارغًا للتوليد التلقائي"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sn-status">حالة الحساب</Label>
              <select
                id="sn-status"
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ACTIVE" | "SUSPENDED")
                }
              >
                <option value="ACTIVE">نشط</option>
                <option value="SUSPENDED">موقوف</option>
              </select>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary font-semibold shadow-brand"
            >
              {busy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              إنشاء الطالب
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
