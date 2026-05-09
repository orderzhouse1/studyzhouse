import type { Category, Course } from "@prisma/client";

type CourseWithCategory = Course & {
  category: Category | null;
};

export type PublicCourseDto = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  thumbnailUrl: string | null;
  pricingType: Course["pricingType"];
  priceAmount: string | null;
  currency: string;
  level: Course["level"];
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  category: null | { id: string; name: string; slug: string };
  lessonCount: number;
};

export type AdminCourseDto = PublicCourseDto & {
  status: Course["status"];
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export function decimalToString(value: Course["price"]): string | null {
  if (value === null) return null;
  return value.toString();
}

export function mapCoursePublic(
  course: CourseWithCategory & { lessonCount?: number },
): PublicCourseDto {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    shortDescription: course.subtitle,
    description: course.description,
    thumbnailUrl: course.coverImageUrl,
    pricingType: course.pricingType,
    priceAmount: decimalToString(course.price),
    currency: course.currency,
    level: course.level,
    estimatedDurationMinutes: course.estimatedDurationMinutes ?? null,
    publishedAt: course.publishedAt?.toISOString() ?? null,
    category: course.category
      ? {
          id: course.category.id,
          name: course.category.name,
          slug: course.category.slug,
        }
      : null,
    lessonCount: course.lessonCount ?? 0,
  };
}

export function mapCourseAdmin(
  course: CourseWithCategory & { lessonCount?: number },
): AdminCourseDto {
  return {
    ...mapCoursePublic(course),
    status: course.status,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    createdById: course.createdById,
  };
}
