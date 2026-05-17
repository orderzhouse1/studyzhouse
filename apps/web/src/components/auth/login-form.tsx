"use client";

import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthGoogleSection } from "@/components/auth/auth-google-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginRequest } from "@/lib/auth-api";
import { defaultHomeForRole, safeInternalNext } from "@/lib/safe-next";

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");

  const safeNext = useMemo(() => safeInternalNext(nextRaw), [nextRaw]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthMessage = searchParams.get("message");
    if (oauthMessage) {
      setError(oauthMessage);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await loginRequest({
      email,
      password,
    });

    setLoading(false);

    if (!result.ok || !result.user) {
      setError(result.message ?? "تعذّر تسجيل الدخول.");
      return;
    }

    const destination =
      safeNext ?? defaultHomeForRole(result.user.role);
    router.replace(destination);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            البريد الإلكتروني
          </Label>
          <Input
            id="email"
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
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              كلمة المرور
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary/90 hover:text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            dir="ltr"
            className="h-10 rounded-xl border-border/80 text-left text-sm"
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
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              جارٍ الدخول…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden />
              تسجيل الدخول
            </>
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
        ليس لديك حساب؟{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary/90 hover:underline"
        >
          أنشئ حسابًا
        </Link>
      </p>
    </div>
  );
}
