"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { PublicCourseDetail } from "@/components/courses/course-public-detail";
import { CliqPaymentDialog } from "@/components/student/cliq-payment-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogCtaButtonClassName } from "@/lib/catalog-cta-button";
import { cn } from "@/lib/utils";
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

function primaryCtaClass(layout: "hero" | "sidebar"): string {
  return cn(
    layout === "sidebar" ? "w-full" : "min-w-[11rem]",
    catalogCtaButtonClassName,
  );
}

type AccessResponse = {
  success: true;
  data: {
    courseId: string;
    isEnrolled: boolean;
    enrollmentId: string | null;
    progressPercent: number;
    pendingPaymentRequest: { id: string; status: string } | null;
    canEnrollFree: boolean;
  };
};

type EnrollResponse = {
  success: true;
  data: {
    enrollment: { id: string; status: string };
    course: { slug: string };
  };
};

type RedeemResponse = {
  success: true;
  data: {
    course: { slug: string; title: string };
    enrollment: { id: string; status: string };
  };
};

function ActivationCodeField({
  course,
  layout,
  onSuccess,
}: {
  course: PublicCourseDetail;
  layout: "hero" | "sidebar";
  onSuccess: () => void;
}): React.ReactElement {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError("أدخل كود التفعيل (6 أحرف على الأقل).");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await studentFetchJson<RedeemResponse>("/student/activation-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, courseId: course.id }),
      });
      invalidateStudentDataCache();
      onSuccess();
    } catch (err) {
      setError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر تفعيل الكورس. تحقق من الكود.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={cn(
        "flex gap-2",
        layout === "sidebar" ? "flex-col sm:flex-row" : "flex-col sm:flex-row sm:items-start",
      )}
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="أدخل كود التفعيل"
        autoComplete="off"
        spellCheck={false}
        disabled={busy}
        className={cn(
          "h-11 rounded-xl border-border/90 bg-card text-sm",
          layout === "sidebar" ? "flex-1" : "min-w-[12rem] flex-1 sm:max-w-xs",
        )}
        aria-label="كود التفعيل"
      />
      <Button
        type="submit"
        variant="outline"
        disabled={busy}
        className={cn(
          "h-11 shrink-0 rounded-xl border-primary/40 font-semibold text-primary hover:bg-primary/5",
          layout === "sidebar" ? "w-full sm:w-auto" : "w-full sm:w-auto",
        )}
      >
        {busy ? (
          <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        تفعيل الكورس
      </Button>
      {error ? (
        <p
          className={cn(
            "text-sm text-red-700",
            layout === "sidebar" ? "sm:basis-full" : "basis-full",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function CourseStudentActions({
  course,
  layout = "hero",
}: {
  course: PublicCourseDetail;
  layout?: "hero" | "sidebar";
}): React.ReactElement {
  const router = useRouter();
  const [access, setAccess] = useState<AccessResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cliqOpen, setCliqOpen] = useState(false);

  const loadAccess = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await studentFetchJsonCached<AccessResponse>(
        `/student/courses/${encodeURIComponent(course.slug)}/access`,
      );
      setAccess(json.data);
    } catch (e) {
      setAccess(null);
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تحميل حالة الوصول.",
      );
    } finally {
      setLoading(false);
    }
  }, [course.slug]);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  function onRedeemSuccess(): void {
    void loadAccess();
    router.refresh();
    router.push(`/learn/${course.slug}`);
  }

  function onCliqSubmitted(): void {
    invalidateStudentDataCache();
    void loadAccess();
    router.refresh();
  }

  const cliqDialog = (
    <CliqPaymentDialog
      open={cliqOpen}
      onOpenChange={setCliqOpen}
      course={course}
      onSubmitted={onCliqSubmitted}
    />
  );

  const pendingBtn = (
    <Button
      type="button"
      disabled
      size={layout === "sidebar" ? "default" : "lg"}
      variant="outline"
      className={
        layout === "sidebar"
          ? "w-full rounded-xl border-amber-300/80 bg-amber-50/90 text-amber-950"
          : "min-w-[11rem] rounded-xl border-amber-300/80 bg-amber-50/90 text-amber-950"
      }
    >
      انتظار المراجعة
    </Button>
  );

  const cliqBtn = (
    <Button
      type="button"
      size={layout === "sidebar" ? "default" : "lg"}
      className={primaryCtaClass(layout)}
      onClick={() => setCliqOpen(true)}
    >
      شراء عبر كليك
    </Button>
  );

  async function enrollFree(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await studentFetchJson<EnrollResponse>(
        `/student/courses/${encodeURIComponent(course.slug)}/enroll`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      invalidateStudentDataCache();
      router.push(`/learn/${course.slug}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر التسجيل في الكورس.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div
        className={
          layout === "sidebar"
            ? "flex justify-center py-2"
            : "flex flex-wrap gap-3"
        }
      >
        <Button disabled size={layout === "sidebar" ? "default" : "lg"} className="min-w-[11rem]">
          <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
          جاري التحميل…
        </Button>
      </div>
    );
  }

  if (access?.isEnrolled) {
    const btn = (
      <Button
        asChild
        size={layout === "sidebar" ? "default" : "lg"}
        className={primaryCtaClass(layout)}
      >
        <Link href={`/learn/${course.slug}`}>
          {access.progressPercent > 0 ? "متابعة التعلّم" : "ابدأ التعلّم"}
          <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    );
    return layout === "hero" ? (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">{btn}</div>
        {access.progressPercent > 0 ? (
          <p className="text-xs text-muted-foreground">
            تقدّمك الحالي: {access.progressPercent}%
          </p>
        ) : null}
      </div>
    ) : (
      btn
    );
  }

  if (course.pricingType === "FREE" && access?.canEnrollFree) {
    const btn = (
      <Button
        type="button"
        size={layout === "sidebar" ? "default" : "lg"}
        disabled={busy}
        className={primaryCtaClass(layout)}
        onClick={() => void enrollFree()}
      >
        {busy ? (
          <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        احصل على الكورس مجاناً
      </Button>
    );
    return layout === "hero" ? (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">{btn}</div>
        <p className="text-xs text-muted-foreground">
          كورس مجاني — اضغط للتسجيل والبدء فوراً.
        </p>
      </div>
    ) : (
      btn
    );
  }

  if (access?.pendingPaymentRequest) {
    return layout === "hero" ? (
      <>
        <div className="space-y-3">
          {pendingBtn}
          <p className="text-xs text-muted-foreground">
            طلبك قيد المراجعة — سيظهر الكورس في «كورساتي» حتى تتم الموافقة. يمكنك
            استخدام كود تفعيل بدلاً من ذلك:
          </p>
          <ActivationCodeField
            course={course}
            layout="hero"
            onSuccess={onRedeemSuccess}
          />
        </div>
        {cliqDialog}
      </>
    ) : (
      <>
        <div className="space-y-3">
          {pendingBtn}
          <ActivationCodeField
            course={course}
            layout="sidebar"
            onSuccess={onRedeemSuccess}
          />
        </div>
        {cliqDialog}
      </>
    );
  }

  if (layout === "sidebar") {
    return (
      <>
        <div className="space-y-3">
          {cliqBtn}
          <ActivationCodeField
            course={course}
            layout="sidebar"
            onSuccess={onRedeemSuccess}
          />
        </div>
        {cliqDialog}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          {cliqBtn}
          <ActivationCodeField
            course={course}
            layout="hero"
            onSuccess={onRedeemSuccess}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {cliqDialog}
    </>
  );
}
