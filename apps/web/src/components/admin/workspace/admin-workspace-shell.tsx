"use client";

import { Crown, ExternalLink, Menu, MoreHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  getSitePreviewFromPathname,
  getWorkspaceConfig,
  isNavActive,
  isSitePreviewPath,
  type WorkspaceNavItem,
  type WorkspaceRole,
} from "@/components/admin/workspace/admin-workspace-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WORKSPACE_CANVAS_CLASS = "relative bg-[hsl(220_14%_88%)]";

const WORKSPACE_SIDEBAR_CLASS =
  "bg-[linear-gradient(180deg,hsl(222_47%_19%)_0%,hsl(222_47%_16%)_45%,hsl(222_47%_14%)_100%)] shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.08)]";

/** عناصر الشريط السفلي على الجوال — الأهم أولاً */
const MOBILE_BOTTOM_IDS: Record<WorkspaceRole, string[]> = {
  admin: ["dash", "courses", "students", "payments"],
  "super-admin": ["dash", "admins", "audit", "settings"],
};

function pickMobileBottomNav(
  role: WorkspaceRole,
  subNav: WorkspaceNavItem[],
): WorkspaceNavItem[] {
  const ids = MOBILE_BOTTOM_IDS[role];
  return ids
    .map((id) => subNav.find((item) => item.id === id))
    .filter((item): item is WorkspaceNavItem => item != null);
}

function WorkspaceBrand({
  href,
  title,
}: {
  href: string;
  title: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-2 transition-opacity hover:opacity-95"
    >
      <span
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(145deg,hsl(43_96%_58%)_0%,hsl(24_95%_53%)_45%,hsl(35_78%_42%)_100%)] shadow-[0_0_18px_-4px_hsl(38_92%_50%_/_0.65),inset_0_1px_0_hsl(0_0%_100%_/_0.35)] ring-1 ring-[hsl(45_90%_65%_/_0.4)] sm:h-9 sm:w-9 sm:rounded-xl"
        aria-hidden
      >
        <Crown className="h-4 w-4 fill-[hsl(48_100%_93%)] stroke-[hsl(32_55%_26%)] sm:h-[1.15rem] sm:w-[1.15rem]" />
      </span>
      <span className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
        {title}
      </span>
    </Link>
  );
}

function NavLinkRow({
  item,
  pathname,
  onNavigate,
  variant = "sidebar",
}: {
  item: WorkspaceNavItem;
  pathname: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer";
}): React.ReactElement {
  const active = isNavActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
        variant === "sidebar" &&
          (active
            ? "bg-white text-[hsl(222_47%_12%)] shadow-[0_8px_24px_-8px_hsl(0_0%_0%_/_0.35)]"
            : "text-white/80 hover:bg-white/10 hover:text-white"),
        variant === "drawer" &&
          (active
            ? "bg-[hsl(222_47%_14%)] text-white"
            : "bg-white/5 text-white/85 hover:bg-white/10 hover:text-white"),
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active
            ? variant === "sidebar"
              ? "text-primary"
              : "text-primary"
            : "text-white/70",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.preview ? (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold",
            active
              ? "bg-primary/15 text-primary"
              : "bg-white/10 text-white/60",
          )}
        >
          معاينة
        </span>
      ) : null}
    </Link>
  );
}

export function AdminWorkspaceShell({
  role,
  children,
}: {
  role: WorkspaceRole;
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mainNav, subNav, workspaceTitle, workspaceSubtitle, brandHref } =
    getWorkspaceConfig(role);
  const sitePreview = getSitePreviewFromPathname(pathname);
  const isSitePreview = isSitePreviewPath(pathname);

  const brandTitle = role === "admin" ? "لوحة الإدارة" : workspaceTitle;
  const mobileBottomNav = useMemo(
    () => pickMobileBottomNav(role, subNav),
    [role, subNav],
  );
  const previewNav = mainNav.filter((item) => item.preview);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const closeDrawer = (): void => setDrawerOpen(false);

  return (
    <div
      className={cn(
        "flex h-dvh max-h-dvh overflow-hidden",
        WORKSPACE_CANVAS_CLASS,
      )}
      dir="rtl"
    >
      {/* ——— سطح مكتب: الشريط الجانبي ——— */}
      <aside
        className={cn(
          "hidden h-full w-[15.5rem] shrink-0 flex-col border-s border-white/10 lg:flex",
          WORKSPACE_SIDEBAR_CLASS,
        )}
      >
        <div className="shrink-0 border-b border-white/12 px-5 py-6">
          <p className="text-xs font-semibold tracking-wide text-primary">
            {workspaceTitle}
          </p>
          <p className="mt-1 text-sm font-medium text-white/70">
            {workspaceSubtitle}
          </p>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-3">
          {mainNav.map((item) => (
            <NavLinkRow
              key={item.id}
              item={item}
              pathname={pathname}
              variant="sidebar"
            />
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="[&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-white [&_button]:hover:bg-white/10">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ——— جوال: درج القائمة ——— */}
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={closeDrawer}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-[min(100%,18.5rem)] flex-col border-e border-white/10 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          WORKSPACE_SIDEBAR_CLASS,
          drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/12 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">{brandTitle}</p>
            <p className="mt-0.5 truncate text-sm text-white/70">
              {workspaceSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-3">
          {!isSitePreview ? (
            <div className="space-y-1.5">
              <p className="px-2 text-[0.625rem] font-bold uppercase tracking-wide text-white/45">
                إدارة المنصّة
              </p>
              {subNav.map((item) => (
                <NavLinkRow
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  onNavigate={closeDrawer}
                  variant="drawer"
                />
              ))}
            </div>
          ) : null}

          {previewNav.length > 0 ? (
            <div className="space-y-1.5">
              <p className="px-2 text-[0.625rem] font-bold uppercase tracking-wide text-white/45">
                معاينة الواجهة
              </p>
              {previewNav.map((item) => (
                <NavLinkRow
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  onNavigate={closeDrawer}
                  variant="drawer"
                />
              ))}
            </div>
          ) : null}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="[&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-white [&_button]:hover:bg-white/10">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ——— المحتوى ——— */}
      <div className="relative z-10 flex h-dvh max-h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:px-6 lg:pb-6 lg:pt-6">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-[1.75rem] lg:shadow-[0_20px_56px_-20px_hsl(222_47%_14%_/_0.22)] lg:ring-1 lg:ring-border/50">
            <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[hsl(222_47%_12%)] px-3 sm:px-6">
              {isSitePreview && sitePreview ? (
                <>
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white lg:hidden"
                      onClick={() => setDrawerOpen(true)}
                      aria-label="فتح القائمة"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                    <span className="shrink-0 rounded-md bg-primary/20 px-2 py-0.5 text-[0.625rem] font-bold text-primary">
                      معاينة
                    </span>
                    <span className="truncate text-sm font-bold text-white">
                      {sitePreview.title}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 rounded-lg border-white/25 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link
                      href={sitePreview.src}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="hidden sm:inline">فتح في تبويب جديد</span>
                      <span className="sm:hidden">تبويب</span>
                      <ExternalLink className="ms-1.5 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/15 lg:hidden"
                      onClick={() => setDrawerOpen(true)}
                      aria-label="فتح القائمة"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                    <WorkspaceBrand href={brandHref} title={brandTitle} />
                  </div>
                  <span className="hidden text-xs text-white/60 sm:inline">
                    مساحة إدارة المنصّة
                  </span>
                </>
              )}
            </header>

            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              {!isSitePreview ? (
                <nav
                  className="hidden h-full min-h-0 w-44 shrink-0 flex-col gap-0.5 overflow-y-auto overscroll-contain border-s border-border/60 bg-white p-3 xl:flex xl:w-48"
                  aria-label="تنقل فرعي"
                >
                  {subNav.map((item) => {
                    const active = isNavActive(pathname, item);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                          active
                            ? "bg-[hsl(222_47%_14%)] text-white shadow-sm"
                            : "text-muted-foreground hover:bg-white hover:text-heading",
                        )}
                      >
                        {item.label}
                        {item.preview ? (
                          <span className="mt-0.5 block text-[0.625rem] font-medium text-primary/80">
                            معاينة
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}

              <main
                className={cn(
                  "min-h-0 min-w-0 flex-1",
                  isSitePreview
                    ? "overflow-hidden bg-background"
                    : "overflow-y-auto overscroll-contain bg-[hsl(210_22%_98%)] p-3 sm:p-6",
                  !isSitePreview && "pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-6",
                )}
              >
                {!isSitePreview ? (
                  <div className="mb-4 hidden shrink-0 flex-wrap gap-2 md:flex xl:hidden">
                    {subNav.map((item) => {
                      const active = isNavActive(pathname, item);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            active
                              ? "bg-[hsl(222_47%_14%)] text-white"
                              : "bg-white text-muted-foreground ring-1 ring-border/80",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
                {children}
              </main>
            </div>
          </div>
        </div>

        {/* ——— جوال: شريط تنقل سفلي ——— */}
        {!isSitePreview ? (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_hsl(222_47%_14%_/_0.18)] backdrop-blur-md lg:hidden"
            aria-label="تنقل سريع"
          >
            <div className="grid grid-cols-5 gap-0.5 px-1 pt-1">
              {mobileBottomNav.map((item) => {
                const active = isNavActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[0.625rem] font-semibold transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-heading",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <span className="line-clamp-2 max-w-full text-center leading-tight">
                      {item.label.replace("إدارة ", "").replace("لوحة ", "")}
                    </span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[0.625rem] font-semibold text-muted-foreground transition-colors hover:text-heading"
              >
                <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
                <span>المزيد</span>
              </button>
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
