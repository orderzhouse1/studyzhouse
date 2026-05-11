"use client";

import {
  BookOpen,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Ticket,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/student", label: "لوحة التعلّم", icon: LayoutDashboard },
  { href: "/student/my-courses", label: "كورساتي", icon: GraduationCap },
  { href: "/student/explore", label: "استكشف", icon: Compass },
  { href: "/student/payments", label: "مدفوعاتي", icon: Wallet },
  { href: "/student/redeem", label: "تفعيل كورس", icon: Ticket },
] as const;

export function StudentShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-primary/5">
      <header className="sticky top-0 z-40 border-b border-secondary/70 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <Link
            href="/student"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            مساحة التعلّم
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/student"
                  ? pathname === "/student"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2 md:ms-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
