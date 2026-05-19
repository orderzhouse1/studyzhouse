"use client";

import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
} from "@/lib/student-client-api";
import { cn } from "@/lib/utils";

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
  const formId = useId();
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
    <div className={cn("pb-16", STUDENT_CONTENT_PAD)}>
      <div className="mx-auto w-full max-w-2xl space-y-6 py-6 md:py-8">
        <header className="space-y-2 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            الوصول للكورسات المدفوعة
          </p>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">
            تفعيل كورس
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            أدخل كود التفعيل الذي استلمته من الإدارة لتسجيلك في الكورس.
          </p>
        </header>

        {success ? (
          <section
            className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-card shadow-sm ring-1 ring-emerald-100/80"
            aria-live="polite"
          >
            <div className="border-b border-emerald-200/60 bg-card/90 px-4 py-4 text-center sm:px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-3 text-lg font-bold text-emerald-950">
                تم التفعيل بنجاح
              </h2>
              <p className="mt-1 text-sm text-emerald-900/85">
                {success.course.title}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-center sm:px-6 sm:pb-6">
              <Button
                asChild
                size="sm"
                className="h-9 gap-1 rounded-full px-4 text-xs shadow-brand"
              >
                <Link href={`/learn/${success.course.slug}`}>
                  ابدأ التعلّم
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-4 text-xs"
              >
                <Link href="/student/my-courses">كورساتي</Link>
              </Button>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-border/50">
            <div className="border-b border-border/50 bg-gradient-to-b from-primary/[0.04] to-card px-4 py-3 sm:px-5">
              <p className="text-center text-[0.6875rem] text-muted-foreground">
                الكود يفتح لك الوصول الكامل للكورس بعد التحقق من المنصة
              </p>
            </div>

            <form
              className="space-y-4 px-4 py-5 sm:px-5"
              onSubmit={(e) => void onSubmit(e)}
            >
              {error ? (
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-3 ring-1 ring-primary/10">
                <Shield
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  أدخل الكود كما استلمته (مثل{" "}
                  <span
                    dir="ltr"
                    className="font-mono text-[0.6875rem] font-semibold text-heading"
                  >
                    STUDY-XXXX-XXXX
                  </span>
                  ). لا تشاركه مع غيرك.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-code`} className="text-xs font-semibold">
                  كود التفعيل
                </Label>
                <Input
                  id={`${formId}-code`}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-lg border-border/70 bg-muted/20 px-3 text-center font-mono text-sm tracking-[0.2em] focus:bg-card"
                  placeholder="STUDY-····-····"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={busy || code.trim().length < 6}
                size="sm"
                className="h-10 w-full gap-1 rounded-full text-sm shadow-brand"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                تفعيل الكورس
              </Button>
            </form>
          </section>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ليس لديك كود؟{" "}
          <Link
            href="/student/explore"
            className="font-semibold text-primary hover:underline"
          >
            استكشف الكورسات
          </Link>
          {" · "}
          <Link
            href="/student/my-courses"
            className="font-semibold text-heading hover:text-primary hover:underline"
          >
            كورساتي
          </Link>
        </p>
      </div>
    </div>
  );
}
