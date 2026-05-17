import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  FolderTree,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";

export type WorkspaceNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** معاينة واجهة الزائر/الطالب */
  preview?: boolean;
  match?: (pathname: string) => boolean;
};

export type WorkspaceRole = "admin" | "super-admin";

const adminRoot = "/admin";
const superRoot = "/super-admin";
const sitePreview = (base: string, view: string) => `${base}/preview/site/${view}`;

function startsWith(pathname: string, base: string, segment: string): boolean {
  return pathname === `${base}/${segment}` || pathname.startsWith(`${base}/${segment}/`);
}

function isSitePreview(pathname: string, base: string, view?: string): boolean {
  const prefix = `${base}/preview/site/`;
  if (!pathname.startsWith(prefix)) return false;
  if (!view) return true;
  return pathname === `${prefix}${view}` || pathname.startsWith(`${prefix}${view}/`);
}

/** الشريط الرئيسي: لوحة التحكم + معاينة صفحات المنصّة */
export const ADMIN_MAIN_NAV: WorkspaceNavItem[] = [
  {
    id: "dashboard",
    label: "لوحة الإدارة",
    href: adminRoot,
    icon: LayoutDashboard,
    match: (p) => p === adminRoot,
  },
  {
    id: "preview-home",
    label: "الصفحة الرئيسية",
    href: sitePreview(adminRoot, "home"),
    icon: Home,
    preview: true,
    match: (p) => isSitePreview(p, adminRoot, "home"),
  },
  {
    id: "preview-courses",
    label: "كتالوج الكورسات",
    href: sitePreview(adminRoot, "courses"),
    icon: GraduationCap,
    preview: true,
    match: (p) => isSitePreview(p, adminRoot, "courses"),
  },
  {
    id: "preview-student",
    label: "لوحة الطالب",
    href: sitePreview(adminRoot, "student"),
    icon: Users,
    preview: true,
    match: (p) => isSitePreview(p, adminRoot, "student"),
  },
];

/** التنقل الفرعي: أدوات إدارة المنصّة */
export const ADMIN_SUB_NAV: WorkspaceNavItem[] = [
  {
    id: "dash",
    label: "لوحة الإدارة",
    href: adminRoot,
    icon: LayoutDashboard,
    match: (p) => p === adminRoot,
  },
  {
    id: "courses",
    label: "إدارة الكورسات",
    href: `${adminRoot}/courses`,
    icon: GraduationCap,
    match: (p) => startsWith(p, adminRoot, "courses"),
  },
  {
    id: "students",
    label: "الطلاب",
    href: `${adminRoot}/students`,
    icon: Users,
    match: (p) => startsWith(p, adminRoot, "students"),
  },
  {
    id: "categories",
    label: "التصنيفات",
    href: `${adminRoot}/categories`,
    icon: FolderTree,
    match: (p) => startsWith(p, adminRoot, "categories"),
  },
  {
    id: "payments",
    label: "طلبات الدفع",
    href: `${adminRoot}/payment-requests`,
    icon: CreditCard,
    match: (p) => startsWith(p, adminRoot, "payment-requests"),
  },
  {
    id: "codes",
    label: "أكواد التفعيل",
    href: `${adminRoot}/activation-codes`,
    icon: KeyRound,
    match: (p) => startsWith(p, adminRoot, "activation-codes"),
  },
  {
    id: "analytics",
    label: "التحليلات",
    href: `${adminRoot}/preview/analytics`,
    icon: BarChart3,
    preview: true,
    match: (p) => p.includes("/preview/analytics"),
  },
  {
    id: "governance",
    label: "الحوكمة",
    href: `${adminRoot}/preview/governance`,
    icon: Shield,
    preview: true,
    match: (p) => p.includes("/preview/governance"),
  },
];

export const SUPER_ADMIN_MAIN_NAV: WorkspaceNavItem[] = [
  {
    id: "dashboard",
    label: "لوحة الإدارة",
    href: superRoot,
    icon: LayoutDashboard,
    match: (p) => p === superRoot,
  },
  {
    id: "preview-home",
    label: "الصفحة الرئيسية",
    href: sitePreview(superRoot, "home"),
    icon: Home,
    preview: true,
    match: (p) => isSitePreview(p, superRoot, "home"),
  },
  {
    id: "preview-courses",
    label: "كتالوج الكورسات",
    href: sitePreview(superRoot, "courses"),
    icon: GraduationCap,
    preview: true,
    match: (p) => isSitePreview(p, superRoot, "courses"),
  },
  {
    id: "preview-student",
    label: "لوحة الطالب",
    href: sitePreview(superRoot, "student"),
    icon: Users,
    preview: true,
    match: (p) => isSitePreview(p, superRoot, "student"),
  },
];

export const SUPER_ADMIN_SUB_NAV: WorkspaceNavItem[] = [
  {
    id: "dash",
    label: "لوحة الإدارة",
    href: superRoot,
    icon: LayoutDashboard,
    match: (p) => p === superRoot,
  },
  {
    id: "admins",
    label: "المدراء",
    href: `${superRoot}/admins`,
    icon: Users,
    match: (p) => startsWith(p, superRoot, "admins"),
  },
  {
    id: "audit",
    label: "سجل العمليات",
    href: `${superRoot}/audit-logs`,
    icon: ScrollText,
    match: (p) => startsWith(p, superRoot, "audit-logs"),
  },
  {
    id: "settings",
    label: "الإعدادات",
    href: `${superRoot}/settings`,
    icon: Settings,
    match: (p) => p.startsWith(`${superRoot}/settings`),
  },
  {
    id: "payments",
    label: "المدفوعات",
    href: `${superRoot}/preview/payments`,
    icon: CreditCard,
    preview: true,
    match: (p) => p.includes("/preview/payments"),
  },
  {
    id: "analytics",
    label: "التحليلات",
    href: `${superRoot}/preview/analytics`,
    icon: BarChart3,
    preview: true,
    match: (p) => p.includes("/preview/analytics"),
  },
];

export function getWorkspaceConfig(role: WorkspaceRole): {
  mainNav: WorkspaceNavItem[];
  subNav: WorkspaceNavItem[];
  workspaceTitle: string;
  workspaceSubtitle: string;
  brandHref: string;
} {
  if (role === "super-admin") {
    return {
      mainNav: SUPER_ADMIN_MAIN_NAV,
      subNav: SUPER_ADMIN_SUB_NAV,
      workspaceTitle: "لوحة التحكم",
      workspaceSubtitle: "Super Admin Workspace",
      brandHref: superRoot,
    };
  }
  return {
    mainNav: ADMIN_MAIN_NAV,
    subNav: ADMIN_SUB_NAV,
    workspaceTitle: "لوحة التحكم",
    workspaceSubtitle: "Admin Workspace",
    brandHref: adminRoot,
  };
}

export function isNavActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const SITE_PREVIEW_META: Record<
  string,
  { title: string; src: string }
> = {
  home: { title: "الصفحة الرئيسية", src: "/" },
  courses: { title: "كتالوج الكورسات", src: "/courses?adminPreview=1" },
  student: { title: "لوحة الطالب", src: "/student/explore" },
};

export function getSitePreviewFromPathname(
  pathname: string,
): { title: string; src: string; view: string } | null {
  const match = pathname.match(/\/preview\/site\/([^/]+)/);
  if (!match) return null;
  const view = match[1];
  const meta = SITE_PREVIEW_META[view];
  if (!meta) return null;
  return { ...meta, view };
}

export function isSitePreviewPath(pathname: string): boolean {
  return getSitePreviewFromPathname(pathname) !== null;
}
