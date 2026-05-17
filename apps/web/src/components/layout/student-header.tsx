"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import {
  HeaderBrand,
  HEADER_INNER_CLASS,
  HEADER_MOBILE_SEARCH_CLASS,
  HEADER_ROOT_CLASS,
} from "@/components/layout/header-brand";
import { HeaderSearchField } from "@/components/layout/header-search-field";
import { StudentHeaderActions } from "@/components/layout/student-header-actions";
import { cn } from "@/lib/utils";

const STUDENT_NAV: Array<{ href: string; label: string }> = [
  { href: "/student", label: "لوحة التعلّم" },
  { href: "/student/my-courses", label: "كورساتي" },
  { href: "/student/explore", label: "استكشف" },
  { href: "/student/redeem", label: "تفعيل كورس" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/student") return pathname === "/student";
  if (href === "/student/my-courses") {
    return (
      pathname.startsWith("/student/my-courses") ||
      pathname.startsWith("/learn/")
    );
  }
  return pathname.startsWith(href);
}

function navLinkClass(active: boolean, size: "sm" | "base" = "sm"): string {
  return cn(
    "whitespace-nowrap font-medium transition-colors",
    size === "sm" ? "px-2.5 py-2 text-sm lg:px-3" : "px-3 py-3 text-base",
    active
      ? "font-semibold text-primary"
      : "text-muted-foreground hover:text-primary",
  );
}

export function StudentHeader(): React.ReactElement {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header className={HEADER_ROOT_CLASS}>
        <div className={HEADER_INNER_CLASS}>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <HeaderBrand href="/student" tagline="مساحة التعلّم" />

            <span
              className="hidden h-9 w-px shrink-0 bg-border lg:block"
              aria-hidden
            />

            <nav
              className="hidden min-w-0 items-center gap-1 lg:flex"
              aria-label="تنقل الطالب"
            >
              {STUDENT_NAV.map(({ href, label }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={navLinkClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 md:block md:w-[11.5rem] lg:w-[14rem]">
              <HeaderSearchField catalogHref="/student/explore" />
            </div>

            <StudentHeaderActions />

            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-heading transition hover:bg-muted/60 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
              <span className="sr-only">
                {menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              </span>
            </button>
          </div>
        </div>

        <div className={HEADER_MOBILE_SEARCH_CLASS}>
          <HeaderSearchField catalogHref="/student/explore" />
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-heading/40 transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMenuOpen(false)}
          tabIndex={menuOpen ? 0 : -1}
          aria-label="إغلاق القائمة"
        />
        <div
          id={menuId}
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-border bg-card shadow-xl transition-transform duration-200 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
            <span className="text-sm font-bold text-heading">القائمة</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-primary"
              onClick={() => setMenuOpen(false)}
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
            aria-label="تنقل الجوال"
          >
            {STUDENT_NAV.map(({ href, label }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={navLinkClass(active, "base")}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
