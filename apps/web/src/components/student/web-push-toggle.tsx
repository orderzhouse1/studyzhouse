"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getExistingPushSubscription,
  isWebPushSupportedInBrowser,
  loadWebPushServerConfig,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "@/lib/web-push-client";
import { cn } from "@/lib/utils";

type PushUiState =
  | "loading"
  | "unsupported"
  | "server_disabled"
  | "default"
  | "subscribed"
  | "denied"
  | "error";

export function WebPushToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}): React.ReactElement {
  const [state, setState] = useState<PushUiState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setError(null);
    if (!isWebPushSupportedInBrowser()) {
      setState("unsupported");
      return;
    }

    try {
      const cfg = await loadWebPushServerConfig();
      if (!cfg.configured || !cfg.publicKey) {
        setState("server_disabled");
        return;
      }
      setPublicKey(cfg.publicKey);

      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const sub = await getExistingPushSubscription();
      setState(sub ? "subscribed" : "default");
    } catch {
      setState("error");
      setError("تعذّر التحقق من إعدادات الإشعارات.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable(): Promise<void> {
    if (!publicKey) return;
    setBusy(true);
    setError(null);
    try {
      await subscribeToWebPush(publicKey);
      setState("subscribed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "PERMISSION_DENIED") {
        setState("denied");
        setError("رفضت إذن الإشعارات من المتصفح. يمكنك تفعيلها من إعدادات الموقع.");
      } else {
        setState("error");
        setError(msg || "تعذّر تفعيل إشعارات المتصفح.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromWebPush();
      setState("default");
    } catch {
      setError("تعذّر إلغاء التفعيل.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        جاري التحقق…
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        متصفحك لا يدعم إشعارات Web Push.
      </p>
    );
  }

  if (state === "server_disabled") {
    return (
      <div className={cn("rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-3 text-sm text-muted-foreground", className)}>
        إشعارات المتصفح غير مفعّلة على الخادم حالياً. الإشعارات داخل المنصة تعمل بشكل طبيعي.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          {state === "subscribed" ? (
            <Bell className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
          ) : (
            <BellOff className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
          )}
          <div>
            <p className="text-sm font-medium text-heading">إشعارات المتصفح</p>
            <p className="text-xs text-muted-foreground">
              {state === "subscribed"
                ? "مفعّلة — ستصلك تنبيهات خارج التطبيق عند وجود إشعار جديد."
                : state === "denied"
                  ? "الإذن مرفوض من المتصفح."
                  : "فعّل يدوياً لتلقي تنبيهات على سطح المكتب أو الهاتف."}
            </p>
          </div>
        </div>
        {state === "subscribed" ? (
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            disabled={busy}
            className="rounded-xl shrink-0"
            onClick={() => void disable()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "إلغاء التفعيل"}
          </Button>
        ) : state !== "denied" ? (
          <Button
            type="button"
            size={compact ? "sm" : "default"}
            disabled={busy}
            className="rounded-xl shrink-0"
            onClick={() => void enable()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "تفعيل إشعارات المتصفح"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-800">{error}</p> : null}
    </div>
  );
}
