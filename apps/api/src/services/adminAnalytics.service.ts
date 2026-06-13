import {
  CourseReviewStatus,
  CourseStatus,
  EnrollmentStatus,
  PaymentRequestStatus,
  UserRole,
  UserStatus,
  type Prisma,
} from "@prisma/client";

import type {
  AdminAnalyticsCourseRow,
  AdminAnalyticsCourses,
  AdminAnalyticsDailyCount,
  AdminAnalyticsEngagement,
  AdminAnalyticsOverview,
  AdminAnalyticsStudents,
} from "@studyhouse/shared";

import { prisma } from "../lib/prisma.js";

const STUDENT_WHERE: Prisma.UserWhereInput = {
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function fillDailySeries(
  counts: Map<string, number>,
  days: number,
): AdminAnalyticsDailyCount[] {
  const out: AdminAnalyticsDailyCount[] = [];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

async function countActiveStudents(since: Date): Promise<number> {
  const rows = await prisma.lessonProgress.findMany({
    where: { lastWatchedAt: { gte: since } },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  return rows.length;
}

async function buildCourseAnalyticsRows(): Promise<AdminAnalyticsCourseRow[]> {
  const courses = await prisma.course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: { title: "asc" },
  });

  if (courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  const [enrollmentGroups, reviewGroups, ratingGroups, completionGroups] =
    await Promise.all([
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: courseIds },
          status: EnrollmentStatus.ACTIVE,
        },
        _count: { _all: true },
        _avg: { progressPercent: true },
      }),
      prisma.courseReview.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
      }),
      prisma.courseReview.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: courseIds },
          status: CourseReviewStatus.PUBLISHED,
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.enrollment.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: courseIds },
          status: EnrollmentStatus.ACTIVE,
          OR: [{ progressPercent: 100 }, { completedAt: { not: null } }],
        },
        _count: { _all: true },
      }),
    ]);

  const enrollMap = new Map(
    enrollmentGroups.map((r) => [
      r.courseId,
      { count: r._count._all, avg: r._avg.progressPercent ?? 0 },
    ]),
  );
  const reviewMap = new Map(
    reviewGroups.map((r) => [r.courseId, r._count._all]),
  );
  const ratingMap = new Map(
    ratingGroups.map((r) => [
      r.courseId,
      {
        avg: r._avg.rating,
        count: r._count._all,
      },
    ]),
  );
  const completedMap = new Map(
    completionGroups.map((r) => [r.courseId, r._count._all]),
  );

  return courses.map((course) => {
    const enroll = enrollMap.get(course.id);
    const rating = ratingMap.get(course.id);
    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      enrollmentCount: enroll?.count ?? 0,
      reviewCount: reviewMap.get(course.id) ?? rating?.count ?? 0,
      averageRating:
        rating?.avg != null ? Math.round(rating.avg * 10) / 10 : null,
      averageCompletionPercent: Math.round(enroll?.avg ?? 0),
      completedStudentsCount: completedMap.get(course.id) ?? 0,
    };
  });
}

function sortCourses(
  rows: AdminAnalyticsCourseRow[],
  pick: (r: AdminAnalyticsCourseRow) => number,
  min = 0,
): AdminAnalyticsCourseRow[] {
  return [...rows]
    .filter((r) => pick(r) > min || min === 0)
    .sort((a, b) => pick(b) - pick(a))
    .slice(0, 10);
}

export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  const since7 = daysAgo(7);
  const since30 = daysAgo(30);

  const [
    totalStudents,
    newStudents7d,
    newStudents30d,
    activeStudents7d,
    activeStudents30d,
    totalPublishedCourses,
    totalEnrollments,
    pendingPaymentRequests,
    approvedPaymentRequests,
    rejectedPaymentRequests,
    newReviews7d,
    pendingReviews,
    activationCodesUsed7d,
    enrollmentAvg,
  ] = await Promise.all([
    prisma.user.count({ where: STUDENT_WHERE }),
    prisma.user.count({
      where: { ...STUDENT_WHERE, createdAt: { gte: since7 } },
    }),
    prisma.user.count({
      where: { ...STUDENT_WHERE, createdAt: { gte: since30 } },
    }),
    countActiveStudents(since7),
    countActiveStudents(since30),
    prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    prisma.enrollment.count({
      where: { status: EnrollmentStatus.ACTIVE },
    }),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.PENDING },
    }),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.APPROVED },
    }),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.REJECTED },
    }),
    prisma.courseReview.count({
      where: { createdAt: { gte: since7 } },
    }),
    prisma.courseReview.count({
      where: { status: CourseReviewStatus.PENDING },
    }),
    prisma.codeRedemption.count({
      where: { redeemedAt: { gte: since7 } },
    }),
    prisma.enrollment.aggregate({
      where: { status: EnrollmentStatus.ACTIVE },
      _avg: { progressPercent: true },
    }),
  ]);

  return {
    totalStudents,
    newStudents7d,
    newStudents30d,
    activeStudents7d,
    activeStudents30d,
    totalPublishedCourses,
    totalEnrollments,
    pendingPaymentRequests,
    approvedPaymentRequests,
    rejectedPaymentRequests,
    newReviews7d,
    pendingReviews,
    activationCodesUsed7d,
    averageCourseCompletionPercent: Math.round(
      enrollmentAvg._avg.progressPercent ?? 0,
    ),
  };
}

export async function getAdminAnalyticsCourses(): Promise<AdminAnalyticsCourses> {
  const allCourses = await buildCourseAnalyticsRows();

  return {
    topByEnrollments: sortCourses(allCourses, (r) => r.enrollmentCount),
    topByRating: sortCourses(
      allCourses.filter((r) => r.reviewCount > 0 && r.averageRating != null),
      (r) => r.averageRating ?? 0,
    ),
    highestCompletion: sortCourses(
      allCourses.filter((r) => r.enrollmentCount > 0),
      (r) => r.averageCompletionPercent,
    ),
    lowestCompletion: [...allCourses]
      .filter((r) => r.enrollmentCount > 0)
      .sort(
        (a, b) => a.averageCompletionPercent - b.averageCompletionPercent,
      )
      .slice(0, 10),
    allCourses,
  };
}

async function studentLeaders(
  order: "desc" | "asc",
  limit: number,
): Promise<
  Array<{
    studentId: string;
    fullName: string;
    email: string;
    enrolledCoursesCount: number;
    averageProgressPercent: number;
    lastActivityAt: string | null;
  }>
> {
  const students = await prisma.user.findMany({
    where: STUDENT_WHERE,
    select: {
      id: true,
      fullName: true,
      email: true,
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE },
        select: { progressPercent: true },
      },
      lessonProgressRecords: {
        orderBy: { lastWatchedAt: "desc" },
        take: 1,
        select: { lastWatchedAt: true },
      },
    },
  });

  const rows = students
    .filter((s) => s.enrollments.length > 0)
    .map((s) => {
      const avg =
        s.enrollments.reduce((sum, e) => sum + e.progressPercent, 0) /
        s.enrollments.length;
      return {
        studentId: s.id,
        fullName: s.fullName,
        email: s.email,
        enrolledCoursesCount: s.enrollments.length,
        averageProgressPercent: Math.round(avg),
        lastActivityAt:
          s.lessonProgressRecords[0]?.lastWatchedAt?.toISOString() ?? null,
      };
    })
    .sort((a, b) =>
      order === "desc"
        ? b.averageProgressPercent - a.averageProgressPercent
        : a.averageProgressPercent - b.averageProgressPercent,
    )
    .slice(0, limit);

  return rows;
}

export async function getAdminAnalyticsStudents(): Promise<AdminAnalyticsStudents> {
  const since7 = daysAgo(7);
  const since14 = daysAgo(14);
  const since30 = daysAgo(30);

  const [
    newStudents7d,
    newStudents30d,
    activeStudents7d,
    topProgressStudents,
    countryRows,
    enrolledStudents,
  ] = await Promise.all([
    prisma.user.count({
      where: { ...STUDENT_WHERE, createdAt: { gte: since7 } },
    }),
    prisma.user.count({
      where: { ...STUDENT_WHERE, createdAt: { gte: since30 } },
    }),
    countActiveStudents(since7),
    studentLeaders("desc", 10),
    prisma.studentProfile.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: {
        ...STUDENT_WHERE,
        enrollments: {
          some: { status: EnrollmentStatus.ACTIVE },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: { id: true, progressPercent: true },
        },
        lessonProgressRecords: {
          orderBy: { lastWatchedAt: "desc" },
          take: 1,
          select: { lastWatchedAt: true },
        },
      },
    }),
  ]);

  const inactiveStudents7d = enrolledStudents.filter((s) => {
    const last = s.lessonProgressRecords[0]?.lastWatchedAt;
    return !last || last < since7;
  }).length;

  const inactiveStudents14d = enrolledStudents.filter((s) => {
    const last = s.lessonProgressRecords[0]?.lastWatchedAt;
    return !last || last < since14;
  }).length;

  const staleEnrollmentStudents = enrolledStudents
    .filter((s) => {
      const last = s.lessonProgressRecords[0]?.lastWatchedAt;
      return !last || last < since14;
    })
    .map((s) => {
      const avg =
        s.enrollments.reduce((sum, e) => sum + e.progressPercent, 0) /
        s.enrollments.length;
      return {
        studentId: s.id,
        fullName: s.fullName,
        email: s.email,
        enrolledCoursesCount: s.enrollments.length,
        averageProgressPercent: Math.round(avg),
        lastActivityAt:
          s.lessonProgressRecords[0]?.lastWatchedAt?.toISOString() ?? null,
      };
    })
    .slice(0, 10);

  const countryDistribution = countryRows
    .filter((r) => r.country)
    .map((r) => ({
      country: r.country as string,
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    newStudents7d,
    newStudents30d,
    activeStudents7d,
    inactiveStudents7d,
    inactiveStudents14d,
    topProgressStudents,
    staleEnrollmentStudents,
    countryDistribution,
  };
}

export async function getAdminAnalyticsEngagement(
  days = 30,
): Promise<AdminAnalyticsEngagement> {
  const since = daysAgo(days);

  const [
    totalLessonProgressRecords,
    completedLessonsCount,
    watchedAgg,
    lessonCompletions,
    courseProgressGroups,
    enrollmentDates,
    reviewDates,
    paymentDates,
  ] = await Promise.all([
    prisma.lessonProgress.count(),
    prisma.lessonProgress.count({ where: { isCompleted: true } }),
    prisma.lessonProgress.aggregate({
      _avg: { watchedSeconds: true },
    }),
    prisma.lessonProgress.groupBy({
      by: ["lessonId"],
      where: { isCompleted: true },
      _count: { _all: true },
      orderBy: { _count: { lessonId: "desc" } },
      take: 10,
    }),
    prisma.lessonProgress.groupBy({
      by: ["courseId"],
      _count: { _all: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 10,
    }),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.courseReview.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.paymentRequest.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const lessonIds = lessonCompletions.map((r) => r.lessonId);
  const lessons =
    lessonIds.length > 0
      ? await prisma.lesson.findMany({
          where: { id: { in: lessonIds } },
          select: {
            id: true,
            title: true,
            course: { select: { title: true } },
          },
        })
      : [];
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  const courseIds = courseProgressGroups.map((r) => r.courseId);
  const courses =
    courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const completedByCourse = await prisma.lessonProgress.groupBy({
    by: ["courseId"],
    where: { isCompleted: true, courseId: { in: courseIds } },
    _count: { _all: true },
  });
  const completedCourseMap = new Map(
    completedByCourse.map((r) => [r.courseId, r._count._all]),
  );

  const enrollCounts = new Map<string, number>();
  for (const row of enrollmentDates) {
    const key = row.createdAt.toISOString().slice(0, 10);
    enrollCounts.set(key, (enrollCounts.get(key) ?? 0) + 1);
  }

  const reviewCounts = new Map<string, number>();
  for (const row of reviewDates) {
    const key = row.createdAt.toISOString().slice(0, 10);
    reviewCounts.set(key, (reviewCounts.get(key) ?? 0) + 1);
  }

  const paymentCounts = new Map<string, number>();
  for (const row of paymentDates) {
    const key = row.createdAt.toISOString().slice(0, 10);
    paymentCounts.set(key, (paymentCounts.get(key) ?? 0) + 1);
  }

  return {
    totalLessonProgressRecords,
    completedLessonsCount,
    averageWatchedSeconds: Math.round(watchedAgg._avg.watchedSeconds ?? 0),
    topCompletedLessons: lessonCompletions.map((row) => {
      const lesson = lessonMap.get(row.lessonId);
      return {
        lessonId: row.lessonId,
        lessonTitle: lesson?.title ?? "—",
        courseTitle: lesson?.course.title ?? "—",
        completionCount: row._count._all,
      };
    }),
    topCoursesByProgress: courseProgressGroups.map((row) => {
      const course = courseMap.get(row.courseId);
      return {
        courseId: row.courseId,
        title: course?.title ?? "—",
        slug: course?.slug ?? "",
        progressEvents: row._count._all,
        completedLessons: completedCourseMap.get(row.courseId) ?? 0,
      };
    }),
    enrollmentsByDay: fillDailySeries(enrollCounts, days),
    reviewsByDay: fillDailySeries(reviewCounts, days),
    paymentRequestsByDay: fillDailySeries(paymentCounts, days),
  };
}
