import {
  CourseStatus,
  EnrollmentStatus,
  type Course,
  type Category,
} from "@prisma/client";

import {
  STUDENT_INTEREST_MATCH_HINTS,
  normalizeCourseThumbnailUrl,
  type StudentInterestId,
  type StudentRecommendationItem,
  type StudentRecommendationReason,
} from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { decimalToString } from "../lib/courseMapper.js";
import { prisma } from "../lib/prisma.js";
import { getCourseRatingSummaries } from "./courseReview.service.js";

type CourseRow = Course & { category: Category | null };

const REASON_LABELS: Record<StudentRecommendationReason, string> = {
  INTEREST: "قريب من اهتماماتك",
  ENROLLED_CATEGORY: "من نفس مجال كورساتك",
  SAVED_CATEGORY: "يشبه الكورسات المحفوظة",
  TOP_RATED: "تقييم مرتفع",
  POPULAR: "الأكثر تسجيلاً",
  NEW: "كورس جديد",
};

const REASON_PRIORITY: StudentRecommendationReason[] = [
  "INTEREST",
  "ENROLLED_CATEGORY",
  "SAVED_CATEGORY",
  "TOP_RATED",
  "POPULAR",
  "NEW",
];

function parseInterestIds(raw: unknown): StudentInterestId[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(Object.keys(STUDENT_INTEREST_MATCH_HINTS));
  return raw.filter(
    (v): v is StudentInterestId =>
      typeof v === "string" && allowed.has(v),
  );
}

function courseHaystack(course: CourseRow): string {
  return `${course.title} ${course.description} ${course.subtitle ?? ""} ${course.category?.name ?? ""} ${course.category?.slug ?? ""}`;
}

function matchesInterests(
  hay: string,
  interestIds: StudentInterestId[],
): boolean {
  for (const id of interestIds) {
    const patterns = STUDENT_INTEREST_MATCH_HINTS[id];
    if (patterns?.some((re) => re.test(hay))) return true;
  }
  return false;
}

function pickPrimaryReason(
  signals: Set<StudentRecommendationReason>,
): StudentRecommendationReason {
  for (const reason of REASON_PRIORITY) {
    if (signals.has(reason)) return reason;
  }
  return "POPULAR";
}

function mapCourse(
  course: CourseRow,
  rating: { averageRating: number | null; reviewCount: number },
): StudentRecommendationItem["course"] {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    thumbnailUrl: normalizeCourseThumbnailUrl(course.coverImageUrl),
    pricingType: course.pricingType,
    priceAmount: decimalToString(course.price),
    currency: course.currency,
    level: course.level,
    estimatedDurationMinutes: course.estimatedDurationMinutes ?? null,
    category: course.category
      ? {
          id: course.category.id,
          name: course.category.name,
          slug: course.category.slug,
        }
      : null,
    averageRating: rating.averageRating,
    reviewCount: rating.reviewCount,
  };
}

export async function listRecommendationsForStudent(
  studentId: string,
  limit: number,
): Promise<StudentRecommendationItem[]> {
  const [profile, enrollments, dismissals, savedRows, candidates] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { interests: true },
      }),
      prisma.enrollment.findMany({
        where: { studentId, status: EnrollmentStatus.ACTIVE },
        select: { courseId: true, course: { select: { categoryId: true } } },
      }),
      prisma.courseRecommendationDismissal.findMany({
        where: { studentId },
        select: { courseId: true },
      }),
      prisma.studentSavedCourse.findMany({
        where: { studentId },
        select: { course: { select: { categoryId: true } } },
      }),
      prisma.course.findMany({
        where: { status: CourseStatus.PUBLISHED },
        include: { category: true },
        orderBy: { publishedAt: "desc" },
        take: 120,
      }),
    ]);

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const dismissedIds = new Set(dismissals.map((d) => d.courseId));
  const interestIds = parseInterestIds(profile?.interests);
  const enrolledCategoryIds = new Set(
    enrollments
      .map((e) => e.course.categoryId)
      .filter((id): id is string => Boolean(id)),
  );
  const savedCategoryIds = new Set(
    savedRows
      .map((s) => s.course.categoryId)
      .filter((id): id is string => Boolean(id)),
  );

  const pool = candidates.filter(
    (c) => !enrolledIds.has(c.id) && !dismissedIds.has(c.id),
  );
  if (pool.length === 0) return [];

  const courseIds = pool.map((c) => c.id);
  const [ratingMap, enrollmentCounts] = await Promise.all([
    getCourseRatingSummaries(courseIds),
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: {
        courseId: { in: courseIds },
        status: EnrollmentStatus.ACTIVE,
      },
      _count: { _all: true },
    }),
  ]);

  const countByCourse = new Map(
    enrollmentCounts.map((r) => [r.courseId, r._count._all]),
  );
  const maxEnrollments = Math.max(
    1,
    ...enrollmentCounts.map((r) => r._count._all),
  );

  const now = Date.now();
  const scored: StudentRecommendationItem[] = pool.map((course) => {
    const hay = courseHaystack(course);
    const rating = ratingMap.get(course.id) ?? {
      averageRating: null,
      reviewCount: 0,
    };
    const enrollCount = countByCourse.get(course.id) ?? 0;
    const signals = new Set<StudentRecommendationReason>();
    let score = 0;

    if (interestIds.length > 0 && matchesInterests(hay, interestIds)) {
      signals.add("INTEREST");
      score += 100;
    }

    if (
      course.categoryId &&
      enrolledCategoryIds.has(course.categoryId)
    ) {
      signals.add("ENROLLED_CATEGORY");
      score += 60;
    }

    if (course.categoryId && savedCategoryIds.has(course.categoryId)) {
      signals.add("SAVED_CATEGORY");
      score += 40;
    }

    if (
      rating.reviewCount >= 3 &&
      rating.averageRating != null &&
      rating.averageRating >= 4.5
    ) {
      signals.add("TOP_RATED");
      score += 50;
    } else if (
      rating.reviewCount >= 1 &&
      rating.averageRating != null &&
      rating.averageRating >= 4
    ) {
      signals.add("TOP_RATED");
      score += 30;
    }

    if (enrollCount >= Math.max(5, Math.ceil(maxEnrollments * 0.6))) {
      signals.add("POPULAR");
      score += 40;
    } else if (enrollCount >= 3) {
      signals.add("POPULAR");
      score += 20;
    }

    const publishedAt = course.publishedAt?.getTime();
    if (publishedAt) {
      const ageDays = (now - publishedAt) / (1000 * 60 * 60 * 24);
      if (ageDays <= 30) {
        signals.add("NEW");
        score += 25;
      } else if (ageDays <= 90) {
        signals.add("NEW");
        score += 10;
      }
    }

    if (signals.size === 0) {
      signals.add("POPULAR");
      score += 5;
    }

    const reason = pickPrimaryReason(signals);
    return {
      course: mapCourse(course, rating),
      reason,
      reasonLabelAr: REASON_LABELS[reason],
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title, "ar"));

  return scored.slice(0, limit);
}

export async function dismissRecommendationForStudent(
  studentId: string,
  courseId: string,
): Promise<{ dismissed: true; alreadyDismissed: boolean }> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED },
    select: { id: true },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير متاح.", 404);
  }

  const existing = await prisma.courseRecommendationDismissal.findUnique({
    where: {
      studentId_courseId: { studentId, courseId },
    },
  });

  if (existing) {
    return { dismissed: true, alreadyDismissed: true };
  }

  await prisma.courseRecommendationDismissal.create({
    data: { studentId, courseId },
  });

  return { dismissed: true, alreadyDismissed: false };
}
