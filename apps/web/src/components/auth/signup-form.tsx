"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AuthGoogleSection } from "@/components/auth/auth-google-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signupRequestOtp,
  signupResendOtp,
  signupVerifyOtp,
} from "@/lib/auth-api";

function fieldError(
  errors: Record<string, string[]> | undefined,
  key: string,
): string | null {
  const list = errors?.[key];
  return list?.[0] ?? null;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

type Step = "account" | "otp" | "success";

export function SignupForm(): React.ReactElement {
  const [step, setStep] = useState<Step>("account");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[]> | undefined
  >();
  const [resendCooldownSec, setResendCooldownSec] = useState(0);

  const startResendCooldown = useCallback((untilIso: string) => {
    const until = new Date(untilIso).getTime();
    const tick = (): void => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setResendCooldownSec(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const id = window.setInterval(() => {
      setResendCooldownSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldownSec]);

  async function onAccountSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!termsAccepted) return;

    setLoading(true);
    setError(null);
    setFieldErrors(undefined);

    const result = await signupRequestOtp({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      acceptTerms: true,
    });

    setLoading(false);

    if (!result.ok) {
      setError(
        result.code === "EMAIL_NOT_CONFIGURED"
          ? "إرسال البريد غير مفعّل على الخادم. أضف RESEND_API_KEY و EMAIL_FROM في ملف .env لخادم API."
          : result.message,
      );
      setFieldErrors(result.fieldErrors);
      return;
    }

    setChallengeId(result.challengeId);
    setOtp("");
    setStep("otp");
    if (result.resendAvailableAt) {
      startResendCooldown(result.resendAvailableAt);
    } else {
      setResendCooldownSec(60);
    }
  }

  async function onOtpSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!challengeId || otp.trim().length !== 6) return;

    setLoading(true);
    setError(null);

    const result = await signupVerifyOtp({
      challengeId,
      code: otp.trim(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setStep("success");
  }

  async function onResend(): Promise<void> {
    if (!challengeId || resendCooldownSec > 0) return;

    setResendLoading(true);
    setError(null);

    const result = await signupResendOtp({ challengeId });

    setResendLoading(false);

    if (!result.ok) {
      setError(result.message);
      if (result.resendAvailableAt) {
        startResendCooldown(result.resendAvailableAt);
      }
      return;
    }

    if (result.resendAvailableAt) {
      startResendCooldown(result.resendAvailableAt);
    } else {
      setResendCooldownSec(60);
    }
  }

  if (step === "success") {
    return (
      <div className="space-y-5">
        <div
          className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-6 text-center"
          role="status"
        >
          <CheckCircle2
            className="h-10 w-10 text-emerald-600"
            aria-hidden
          />
          <p className="text-sm font-medium text-emerald-950">
            تم تأكيد بريدك وإنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن.
          </p>
        </div>
        <Button asChild className="h-10 w-full rounded-xl text-sm font-semibold">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-5">
        <div
          className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3 text-start text-xs leading-relaxed text-muted-foreground sm:text-sm"
          role="status"
        >
          <p>
            أُرسل رمز مكوّن من 6 أرقام إلى{" "}
            <span className="font-medium text-heading" dir="ltr">
              {maskEmail(email.trim().toLowerCase())}
            </span>
            . صالح لمدة 10 دقائق.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onOtpSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="signup-otp" className="text-sm font-medium">
              رمز التحقق
            </Label>
            <Input
              id="signup-otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(ev) =>
                setOtp(ev.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              required
              dir="ltr"
              className="h-10 rounded-xl border-border/80 text-center text-lg tracking-[0.35em]"
            />
          </div>

          {error ? (
            <div
              className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-10 w-full rounded-xl text-sm font-semibold shadow-brand"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                جارٍ التحقق…
              </>
            ) : (
              "تأكيد وإنشاء الحساب"
            )}
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl text-sm"
            disabled={resendLoading || resendCooldownSec > 0}
            onClick={() => void onResend()}
          >
            {resendLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : resendCooldownSec > 0 ? (
              `إعادة الإرسال (${resendCooldownSec}ث)`
            ) : (
              "إعادة إرسال الرمز"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl text-sm text-muted-foreground"
            onClick={() => {
              setStep("account");
              setError(null);
              setChallengeId(null);
            }}
          >
            <ArrowRight className="ms-1 h-4 w-4 rotate-180" aria-hidden />
            تعديل البيانات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={onAccountSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium">
            الاسم الكامل
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
            placeholder="الاسم كما يظهر في المنصة"
            required
            className="h-10 rounded-xl border-border/80 text-sm"
          />
          {fieldError(fieldErrors, "fullName") ? (
            <p className="text-xs text-destructive">
              {fieldError(fieldErrors, "fullName")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email" className="text-sm font-medium">
            البريد الإلكتروني
          </Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@example.com"
            required
            dir="ltr"
            className="h-10 rounded-xl border-border/80 text-left text-sm"
          />
          {fieldError(fieldErrors, "email") ? (
            <p className="text-xs text-destructive">
              {fieldError(fieldErrors, "email")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password" className="text-sm font-medium">
            كلمة المرور
          </Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="8 أحرف على الأقل، حرف ورقم"
            required
            minLength={8}
            dir="ltr"
            className="h-10 rounded-xl border-border/80 text-left text-sm"
          />
          {fieldError(fieldErrors, "password") ? (
            <p className="text-xs text-destructive">
              {fieldError(fieldErrors, "password")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            تأكيد كلمة المرور
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            required
            minLength={8}
            dir="ltr"
            className="h-10 rounded-xl border-border/80 text-left text-sm"
          />
          {fieldError(fieldErrors, "confirmPassword") ? (
            <p className="text-xs text-destructive">
              {fieldError(fieldErrors, "confirmPassword")}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-start text-xs leading-relaxed text-muted-foreground sm:text-sm">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(ev) => setTermsAccepted(ev.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            required
          />
          <span>
            أوافق على{" "}
            <Link
              href="/terms"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              الشروط والأحكام
            </Link>{" "}
            و{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              سياسة الخصوصية
            </Link>
            .
          </span>
        </label>
        {fieldError(fieldErrors, "acceptTerms") ? (
          <p className="text-xs text-destructive">
            {fieldError(fieldErrors, "acceptTerms")}
          </p>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-10 w-full rounded-xl text-sm font-semibold shadow-brand"
          disabled={!termsAccepted || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              جارٍ الإرسال…
            </>
          ) : (
            "متابعة — إرسال رمز التحقق"
          )}
        </Button>
      </form>

      <div className="relative flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-border/80" aria-hidden />
        <span className="text-xs text-muted-foreground">أو</span>
        <span className="h-px flex-1 bg-border/80" aria-hidden />
      </div>

      <AuthGoogleSection />

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب؟{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary/90 hover:underline"
        >
          سجّل الدخول
        </Link>
      </p>
    </div>
  );
}
