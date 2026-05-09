"use client";

import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
    <Card className="border-border/70 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
        <CardDescription>
          أدخل بياناتك للوصول إلى لوحة التعلّم أو الإدارة — بتجربة هادئة وواضحة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
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
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              dir="ltr"
              className="text-left"
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
            className="w-full rounded-xl py-6 text-base"
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
                دخول
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link className="font-medium text-primary hover:underline" href="/">
              العودة إلى الصفحة الرئيسية
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
