"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
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
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
} from "@/lib/student-client-api";

type RedeemResponse = {
  success: true;
  data: {
    course: {
      id: string;
      title: string;
      slug: string;
      pricingType: string;
    };
    enrollment: { id: string; status: string };
  };
};

export function StudentRedeemPanel(): React.ReactElement {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RedeemResponse["data"] | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const json = await studentFetchJson<RedeemResponse>(
        `/student/activation-codes/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim() }),
        },
      );
      setSuccess(json.data);
      invalidateStudentDataCache();
      router.refresh();
    } catch (err) {
      setSuccess(null);
      setError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر التفعيل. تحقق من الكود.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="الوصول للكورسات المدفوعة"
        title="تفعيل كورس"
        description="أدخل كود التفعيل الذي استلمته من الإدارة لتسجيلك في الكورس."
      />

      {success ? (
        <Card className="rounded-3xl border border-emerald-200/90 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-950">
              تم التفعيل بنجاح
            </CardTitle>
            <CardDescription className="text-emerald-900/90">
              {success.course.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
            >
              <Link href={`/learn/${success.course.slug}`}>
                ابدأ التعلّم
                <ArrowLeft className="me-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/my-courses">كورساتي</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border-border bg-card shadow-card ring-1 ring-border/60">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {error}
                </div>
              ) : null}
              <div className="rounded-2xl border border-cyan-100/90 bg-cyan-50/70 px-4 py-3 text-sm leading-relaxed text-cyan-950 ring-1 ring-cyan-100">
                أدخل الكود كما استلمته (مثل STUDY-XXXX-XXXX). لا تشاركه مع غيرك.
              </div>
              <div className="space-y-2">
                <Label htmlFor="redeem-code">كود التفعيل</Label>
                <Input
                  id="redeem-code"
                  dir="ltr"
                  autoComplete="off"
                  className="rounded-2xl font-mono text-sm tracking-wide"
                  placeholder="STUDY-····-····"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
              >
                {busy ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                تفعيل
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
