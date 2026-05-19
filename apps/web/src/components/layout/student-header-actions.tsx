"use client";

import type { AuthUser } from "@studyhouse/shared";
import {
  Award,
  Bell,
  HelpCircle,
  Loader2,
  LogOut,
  Settings,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { STUDENT_AVATAR_GRADIENT_CLASS } from "@/components/student/student-dashboard-ui";
import { logoutRequest } from "@/lib/auth-api";
import { studentFetchJsonCached } from "@/lib/student-client-api";
import { cn } from "@/lib/utils";

type MeResponse = {
  success: true;
  data: { user: AuthUser };
};

const MENU_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ElementType;
}> = [
  { href: "/student/profile", label: "الملف الشخصي", icon: User },
  { href: "/student/help", label: "مركز التعليمات", icon: HelpCircle },
  { href: "/student/settings", label: "الإعدادات", icon: Settings },
  { href: "/student/purchases", label: "مشترياتي", icon: ShoppingBag },
];

const MENU_SOON: Array<{ label: string; icon: React.ElementType }> = [
  { label: "الإشعارات", icon: Bell },
  { label: "الإنجازات", icon: Award },
];

function userInitial(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "؟";
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase();
}

function useClickOutside(
  refs: Array<React.RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;
    function onPointerDown(e: MouseEvent | TouchEvent): void {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onOutside();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [refs, onOutside, enabled]);
}

function ProfileInitialBadge({
  initial,
  size = "md",
}: {
  initial: string;
  size?: "sm" | "md";
}): React.ReactElement {
  const dim = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10 text-base";
  return (
    <span
      className={cn(
        dim,
        STUDENT_AVATAR_GRADIENT_CLASS,
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ring-2 ring-border/60",
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function ProfileAvatar({
  user,
  size = "md",
}: {
  user: AuthUser;
  size?: "sm" | "md";
}): React.ReactElement {
  const [imgFailed, setImgFailed] = useState(false);
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  if (user.avatarUrl && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className={cn(dim, "rounded-full object-cover ring-2 ring-border/80")}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <ProfileInitialBadge initial={userInitial(user.fullName)} size={size} />
  );
}

export function StudentHeaderActions({
  className,
  layout = "inline",
}: {
  className?: string;
  layout?: "inline" | "stacked";
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const profileMenuId = useId();
  const notifMenuId = useId();
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const notifWrapRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const closeAll = useCallback(() => {
    setProfileOpen(false);
    setNotifOpen(false);
  }, []);

  useClickOutside([profileWrapRef, notifWrapRef], closeAll, profileOpen || notifOpen);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await studentFetchJsonCached<MeResponse>("/auth/me");
        if (!cancelled) setUser(json.data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeAll]);

  async function onLogout(): Promise<void> {
    setLogoutLoading(true);
    await logoutRequest();
    setLogoutLoading(false);
    closeAll();
    router.replace("/login");
    router.refresh();
  }

  const stacked = layout === "stacked";

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      className={cn(
        stacked
          ? "flex w-full flex-col gap-3"
          : "flex items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <div ref={notifWrapRef} className="relative">
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full text-heading transition hover:bg-muted/70",
            stacked ? "h-11 w-11" : "h-10 w-10",
          )}
          aria-expanded={notifOpen}
          aria-controls={notifMenuId}
          aria-label="الإشعارات"
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>

        {notifOpen ? (
          <div
            id={notifMenuId}
            role="dialog"
            aria-label="الإشعارات"
            className={cn(
              "absolute z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-card p-4 shadow-float",
              stacked ? "start-0" : "end-0",
            )}
          >
            <p className="text-sm font-semibold text-heading">الإشعارات</p>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              الإشعارات قريبًا.
            </p>
          </div>
        ) : null}
      </div>

      <div ref={profileWrapRef} className="relative">
        <button
          type="button"
          className={cn(
            "inline-flex items-center rounded-full transition hover:opacity-90",
            stacked && "w-full gap-3 rounded-xl border border-border px-3 py-2",
          )}
          aria-label={user?.fullName ? `قائمة ${user.fullName}` : "قائمة الحساب"}
          aria-expanded={profileOpen}
          aria-controls={profileMenuId}
          aria-haspopup="menu"
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
        >
          {loadingUser ? (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-muted",
                stacked ? "h-9 w-9" : "h-10 w-10",
              )}
            >
              <Loader2
                className="h-4 w-4 animate-spin text-muted-foreground"
                aria-hidden
              />
            </span>
          ) : user ? (
            <ProfileAvatar user={user} size={stacked ? "sm" : "md"} />
          ) : (
            <ProfileInitialBadge initial="؟" size={stacked ? "sm" : "md"} />
          )}
          {stacked ? (
            <span className="min-w-0 flex-1 truncate ps-2 text-sm font-medium text-heading">
              {user?.fullName ?? "حسابي"}
            </span>
          ) : null}
        </button>

        {profileOpen ? (
          <div
            id={profileMenuId}
            role="menu"
            className={cn(
              "absolute z-50 mt-2 w-[min(100vw-2rem,17.5rem)] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-float",
              stacked ? "start-0 end-0" : "end-0",
            )}
          >
            {user ? (
              <div className="border-b border-border/80 px-4 py-3">
                <p className="truncate text-sm font-semibold text-heading">
                  {user.fullName}
                </p>
                <p
                  dir="ltr"
                  className="truncate text-start text-xs text-muted-foreground"
                >
                  {user.email}
                </p>
              </div>
            ) : null}

            <nav className="py-1" aria-label="قائمة الحساب">
              {MENU_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-muted/60",
                    isActive(href)
                      ? "bg-primary/5 font-semibold text-primary"
                      : "text-heading",
                  )}
                  onClick={closeAll}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive(href) ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  {label}
                </Link>
              ))}
              {MENU_SOON.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  role="menuitem"
                  aria-disabled
                  className="flex cursor-not-allowed items-center justify-between gap-3 px-4 py-2.5 text-sm text-muted-foreground/70"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                    {label}
                  </span>
                  <span className="text-[0.65rem] font-medium text-muted-foreground">
                    قريبًا
                  </span>
                </span>
              ))}
              <button
                type="button"
                role="menuitem"
                disabled={logoutLoading}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm text-heading transition hover:bg-muted/60 disabled:opacity-60"
                onClick={() => void onLogout()}
              >
                {logoutLoading ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <LogOut
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
                تسجيل الخروج
              </button>
            </nav>

            <div className="border-t border-border/80 bg-muted/30 px-4 py-3">
              <p className="text-sm font-semibold text-primary">
                واصل رحلتك التعليمية
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                اكتشف كورسات جديدة في الكتالوج.
              </p>
              <Link
                href="/student/explore"
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                onClick={closeAll}
              >
                استكشف الكورسات ←
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
