"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordRequestOtp,
  forgotPasswordResendOtp,
  forgotPasswordVerifyOtp,
} from "@/lib/auth-api";

function fieldError(
  errors: Record<string, string[]> | undefined,
  key: string,
): string | null {
  return errors?.[key]?.[0] ?? null;
}

type Step = "email" | "reset" | "success";

export function ForgotPasswordForm(): React.ReactElement {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [genericNotice, setGenericNotice] = useState<string | null>(null);

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
      setResendCooldownSec(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
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

  async function onEmailSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await forgotPasswordRequestOtp({
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (!result.ok) {
      setError(
        result.code === "EMAIL_NOT_CONFIGURED"
          ? "إرسال البريد غير مفعّل على الخادم. أضف RESEND_API_KEY و EMAIL_FROM في ملف .env لخادم API."
          : result.message,
      );
      return;
    }

    setGenericNotice(result.message);
    if (result.challengeId) {
      setChallengeId(result.challengeId);
      setStep("reset");
      if (result.resendAvailableAt) {
        startResendCooldown(result.resendAvailableAt);
      } else {
        setResendCooldownSec(60);
      }
    }
  }

  async function onResetSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!challengeId || otp.length !== 6) return;

    setLoading(true);
    setError(null);
    setFieldErrors(undefined);

    const result = await forgotPasswordVerifyOtp({
      challengeId,
      code: otp.trim(),
      newPassword,
      confirmPassword,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setFieldErrors(result.fieldErrors);
      return;
    }

    setStep("success");
  }

  async function onResend(): Promise<void> {
    if (!challengeId || resendCooldownSec > 0) return;

    setResendLoading(true);
    setError(null);

    const result = await forgotPasswordResendOtp({
      challengeId,
      email: email.trim().toLowerCase(),
    });

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
          <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
          <p className="text-sm font-medium text-emerald-950">
            تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.
          </p>
        </div>
        <Button asChild className="h-10 w-full rounded-xl text-sm font-semibold">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="space-y-5">
        {genericNotice ? (
          <p
            className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3 text-start text-xs leading-relaxed text-muted-foreground sm:text-sm"
            role="status"
          >
            {genericNotice}
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={onResetSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="reset-otp" className="text-sm font-medium">
              رمز التحقق
            </Label>
            <Input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
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

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm font-medium">
              كلمة المرور الجديدة
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              required
              minLength={8}
              dir="ltr"
              className="h-10 rounded-xl border-border/80 text-left text-sm"
            />
            {fieldError(fieldErrors, "newPassword") ? (
              <p className="text-xs text-destructive">
                {fieldError(fieldErrors, "newPassword")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password" className="text-sm font-medium">
              تأكيد كلمة المرور
            </Label>
            <Input
              id="confirm-new-password"
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
                جارٍ التحديث…
              </>
            ) : (
              "تغيير كلمة المرور"
            )}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-xl text-sm"
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

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-start text-xs leading-relaxed text-muted-foreground sm:text-sm">
        أدخل بريدك الإلكتروني وسنرسل لك رمزًا لإعادة تعيين كلمة المرور إن كان
        الحساب مسجّلًا لدينا.
      </p>

      <form className="space-y-4" onSubmit={onEmailSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email" className="text-sm font-medium">
            البريد الإلكتروني
          </Label>
          <Input
            id="forgot-email"
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

        {genericNotice && !challengeId ? (
          <p
            className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {genericNotice}
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
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              جارٍ الإرسال…
            </>
          ) : (
            "إرسال رمز التحقق"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
