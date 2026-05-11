"use client";

import {
  Crown,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/super-admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/super-admin/admins", label: "الأدمنز", icon: Users },
  { href: "/super-admin/audit-logs", label: "سجل العمليات", icon: ScrollText },
  { href: "/super-admin/settings", label: "الإعدادات", icon: Settings },
] as const;

export function SuperAdminShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-s border-border/80 bg-card shadow-card lg:flex">
        <div className="border-b border-border/70 px-5 py-7">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <Crown className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                الحوكمة
              </p>
              <p className="text-base font-bold text-heading">المدير الأعلى</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            نظرة شاملة على المنصة والأدمنز والسجلات.
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/70 p-4">
          <div className="[&_button]:w-full [&_button]:rounded-2xl [&_button]:justify-center">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="lg:hidden mb-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/super-admin"
                ? pathname === "/super-admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
          <LogoutButton />
        </div>
        {children}
      </main>
    </div>
  );
}
