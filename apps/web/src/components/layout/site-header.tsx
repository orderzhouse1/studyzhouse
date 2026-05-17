"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import {
  HeaderBrand,
  HEADER_INNER_CLASS,
  HEADER_MOBILE_SEARCH_CLASS,
  HEADER_ROOT_CLASS,
} from "@/components/layout/header-brand";
import { HeaderSearchField } from "@/components/layout/header-search-field";
import { cn } from "@/lib/utils";

type NavLink = {
  id: string;
  label: string;
  href: string;
};

type SiteHeaderProps = {
  /** رابط «مختارات» يظهر على الصفحة الرئيسية فقط */
  showFeaturedLink?: boolean;
  /** تمييز رابط الكورسات عند كونه الصفحة الحالية */
  coursesActive?: boolean;
};

function buildNavLinks(
  showFeaturedLink: boolean,
  coursesActive: boolean,
): NavLink[] {
  const links: NavLink[] = [
    { id: "courses", label: "الكورسات", href: "/courses" },
  ];
  if (showFeaturedLink) {
    links.push({ id: "featured", label: "مختارات", href: "/#featured" });
  }
  if (coursesActive) {
    links.push({ id: "home", label: "الرئيسية", href: "/" });
  }
  return links;
}

export function SiteHeader({
  showFeaturedLink = false,
  coursesActive = false,
}: SiteHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const navLinks = useMemo(
    () => buildNavLinks(showFeaturedLink, coursesActive),
    [showFeaturedLink, coursesActive],
  );

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
            <HeaderBrand href="/" />

            <span
              className="hidden h-9 w-px shrink-0 bg-border md:block"
              aria-hidden
            />

            <nav
              className="hidden min-w-0 items-center gap-0.5 md:flex"
              aria-label="التنقل الرئيسي"
            >
              {navLinks.map((link) => {
                const active =
                  link.id === "courses"
                    ? coursesActive || pathname.startsWith("/courses")
                    : link.href === pathname ||
                      (link.href === "/#featured" && pathname === "/");
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition lg:px-3",
                      active
                        ? "bg-secondary/80 font-semibold text-heading"
                        : "text-foreground/90 hover:bg-muted/70 hover:text-heading",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 md:block md:w-[11.5rem] lg:w-[15rem]">
              <HeaderSearchField />
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="whitespace-nowrap px-2 py-2 text-sm font-semibold text-primary transition hover:text-[hsl(var(--primary-hover))]"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-10 min-w-[6.5rem] items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-brand transition hover:bg-[hsl(var(--primary-hover))]"
              >
                إنشاء حساب
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-heading transition hover:bg-muted/60 md:hidden"
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
          <HeaderSearchField />
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/70"
              onClick={() => setMenuOpen(false)}
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav
            className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
            aria-label="تنقل الجوال"
          >
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted/70"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border/80 p-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex min-h-11 items-center justify-center rounded-xl border border-border py-2 text-sm font-semibold text-primary"
                onClick={() => setMenuOpen(false)}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="flex min-h-11 items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-brand"
                onClick={() => setMenuOpen(false)}
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
