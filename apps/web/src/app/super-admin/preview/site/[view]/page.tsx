import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminSitePreviewFrame } from "@/components/admin/workspace/admin-site-preview-frame";

const SITE_PREVIEWS = {
  home: {
    title: "الصفحة الرئيسية",
    description: "معاينة الصفحة الرئيسية للمنصّة كما يراها الزائر.",
    src: "/",
  },
  courses: {
    title: "كتالوج الكورسات",
    description: "معاينة صفحة استكشاف الكورسات العامة.",
    src: "/courses?adminPreview=1",
  },
  student: {
    title: "لوحة الطالب",
    description: "معاينة لوحة التعلّم واستكشاف الكورسات من منظور الطالب.",
    src: "/student/explore",
  },
} as const;

type ViewKey = keyof typeof SITE_PREVIEWS;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<Metadata> {
  const { view } = await params;
  const preview = SITE_PREVIEWS[view as ViewKey];
  return { title: preview ? `معاينة: ${preview.title}` : "معاينة" };
}

export default async function SuperAdminSitePreviewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<React.ReactElement> {
  const { view } = await params;
  const preview = SITE_PREVIEWS[view as ViewKey];
  if (!preview) notFound();

  return <AdminSitePreviewFrame title={preview.title} src={preview.src} />;
}
