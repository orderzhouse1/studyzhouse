"use client";

import {
  CreditCard,
  FolderTree,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/courses", label: "الكورسات", icon: GraduationCap },
  { href: "/admin/categories", label: "التصنيفات", icon: FolderTree },
  { href: "/admin/students", label: "الطلاب", icon: Users },
  {
    href: "/admin/payment-requests",
    label: "طلبات الدفع",
    icon: CreditCard,
  },
  {
    href: "/admin/activation-codes",
    label: "أكواد التفعيل",
    icon: KeyRound,
  },
] as const;

export function AdminSidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-border/80 bg-card shadow-card lg:flex lg:flex-col">
      <div className="border-b border-border/70 px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          لوحة التحكم
        </p>
        <p className="mt-1 text-lg font-bold text-heading">Studyhouse</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          مساحة إدارة أنيقة وواضحة
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 p-4">
        <div className="rounded-2xl bg-brand-surface px-4 py-3 text-xs leading-relaxed text-secondary-foreground ring-1 ring-sky-100">
          تصميم متناغم مع الهوية التعليمية — بدون رمادي ممل.
        </div>
      </div>
    </aside>
  );
}
