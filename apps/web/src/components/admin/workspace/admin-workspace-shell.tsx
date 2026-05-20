"use client";

import { ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { SiteLogo } from "@/components/layout/site-logo";
import {
  getSitePreviewFromPathname,
  getWorkspaceConfig,
  isNavActive,
  isSitePreviewPath,
  type WorkspaceRole,
} from "@/components/admin/workspace/admin-workspace-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** خلفية الإطار الخارجي — رمادي فاتح موحّد (خارج اللوحة البيضاء) */
const WORKSPACE_CANVAS_CLASS = "relative bg-[hsl(220_14%_88%)]";

/** الشريط الجانبي الرئيسي — كحلي العلامة (ليس أسود) */
const WORKSPACE_SIDEBAR_CLASS =
  "bg-[linear-gradient(180deg,hsl(222_47%_19%)_0%,hsl(222_47%_16%)_45%,hsl(222_47%_14%)_100%)] shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.08)]";

export function AdminWorkspaceShell({
  role,
  children,
}: {
  role: WorkspaceRole;
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mainNav, subNav, workspaceTitle, workspaceSubtitle, brandHref } =
    getWorkspaceConfig(role);
  const sitePreview = getSitePreviewFromPathname(pathname);
  const isSitePreview = isSitePreviewPath(pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn(
        "flex h-dvh max-h-dvh overflow-hidden",
        WORKSPACE_CANVAS_CLASS,
      )}
      dir="rtl"
    >
      {/* الشريط الجانبي الرئيسي */}
      <aside
        className={cn(
          "fixed inset-y-0 end-0 z-50 flex h-dvh max-h-dvh w-[min(100%,17.5rem)] flex-col border-s border-white/10 shadow-[0_8px_40px_-12px_hsl(222_47%_14%_/_0.35)] transition-transform duration-200 lg:static lg:z-10 lg:h-full lg:w-[15.5rem] lg:translate-x-0",
          WORKSPACE_SIDEBAR_CLASS,
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
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
          {mainNav.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all",
                  active
                    ? "bg-white text-[hsl(222_47%_12%)] shadow-[0_8px_24px_-8px_hsl(0_0%_0%_/_0.35)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-primary" : "text-white/70",
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
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="[&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:border-white/20 [&_button]:bg-white/5 [&_button]:text-white [&_button]:hover:bg-white/10">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* منطقة المحتوى — ارتفاع الشاشة، التمرير داخل البطاقة فقط */}
      <div className="relative z-10 flex h-dvh max-h-dvh min-w-0 flex-1 flex-col overflow-hidden lg:me-0">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-white/90 text-heading shadow-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold text-heading">
            {sitePreview?.title ?? workspaceTitle}
          </p>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-white/90 text-heading shadow-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-0 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 lg:pt-6">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_56px_-20px_hsl(222_47%_14%_/_0.22)] ring-1 ring-border/50">
            {/* شريط علوي داخل البطاقة */}
            <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[hsl(222_47%_12%)] px-4 sm:px-6">
              {isSitePreview && sitePreview ? (
                <>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-md bg-primary/20 px-2 py-0.5 text-[0.625rem] font-bold text-primary">
                      معاينة
                    </span>
                    <span className="truncate text-sm font-bold text-white sm:text-base">
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
                      <span className="sm:hidden">تبويب جديد</span>
                      <ExternalLink className="ms-1.5 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <SiteLogo
                    href={brandHref}
                    imageClassName="h-8 max-w-[9.5rem] brightness-110 sm:h-9"
                  />
                  <span className="hidden text-xs text-white/60 sm:inline">
                    مساحة إدارة المنصّة
                  </span>
                </>
              )}
            </header>

            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              {!isSitePreview ? (
                <nav
                  className="hidden h-full min-h-0 w-44 shrink-0 flex-col gap-0.5 overflow-y-auto overscroll-contain border-s border-border/60 bg-[hsl(0,0%,100%)] p-3 xl:flex xl:w-48"
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
                    : "overflow-y-auto overscroll-contain bg-[hsl(210_22%_98%)] p-4 sm:p-6",
                )}
              >
                {!isSitePreview ? (
                  <div className="mb-4 flex shrink-0 flex-wrap gap-2 xl:hidden">
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
      </div>
    </div>
  );
}

