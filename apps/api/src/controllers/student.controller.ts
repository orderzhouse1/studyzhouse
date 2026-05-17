import type { Request, Response } from "express";
import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonStatus,
  PaymentRequestStatus,
  PricingType,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { mapCoursePublic } from "../lib/courseMapper.js";
import { prisma } from "../lib/prisma.js";
import {
  assertStudentEnrollmentForPublishedCourse,
  flattenPublishedLessons,
  updateEnrollmentProgressPercent,
} from "../services/studentLearning.service.js";
import type { LessonProgressBody } from "@studyhouse/shared";

const DESCRIPTION_MAX = 8000;

function trimDescription(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t.length <= DESCRIPTION_MAX) return t;
  return `${t.slice(0, DESCRIPTION_MAX - 1)}…`;
}

function mapLessonProgress(p: {
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt: Date | null;
  lastWatchedAt: Date | null;
}): {
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt: string | null;
  lastAccessedAt: string | null;
} {
  return {
    watchedSeconds: p.watchedSeconds,
    isCompleted: p.isCompleted,
    completedAt: p.completedAt?.toISOString() ?? null,
    lastAccessedAt: p.lastWatchedAt?.toISOString() ?? null,
  };
}

export async function getStudentDashboard(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: EnrollmentStatus.ACTIVE,
      course: { status: CourseStatus.PUBLISHED },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
        },
      },
    },
  });

  const enrolledCoursesCount = enrollments.length;
  const courseIds = enrollments.map((e) => e.courseId);

  const completedLessonsCount =
    courseIds.length === 0
      ? 0
      : await prisma.lessonProgress.count({
          where: {
            studentId,
            isCompleted: true,
            courseId: { in: courseIds },
          },
        });

  const totalLessonsAll =
    courseIds.length === 0
      ? 0
      : await prisma.lesson.count({
          where: {
            courseId: { in: courseIds },
            status: LessonStatus.PUBLISHED,
          },
        });

  const overallProgressPercent =
    totalLessonsAll > 0
      ? Math.min(
          100,
          Math.round((completedLessonsCount / totalLessonsAll) * 100),
        )
      : 0;

  const inProgressCoursesCount = enrollments.filter(
    (e) => e.progressPercent > 0 && e.progressPercent < 100,
  ).length;

  const continueRow =
    courseIds.length === 0
      ? null
      : await prisma.lessonProgress.findFirst({
          where: {
            studentId,
            courseId: { in: courseIds },
            lastWatchedAt: { not: null },
          },
          orderBy: { lastWatchedAt: "desc" },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    title: true,
                    slug: true,
                    coverImageUrl: true,
                  },
                },
              },
            },
          },
        });

  const continueLearning = continueRow
    ? {
        courseTitle: continueRow.lesson.course.title,
        courseSlug: continueRow.lesson.course.slug,
        courseCoverUrl: continueRow.lesson.course.coverImageUrl,
        lessonId: continueRow.lesson.id,
        lessonTitle: continueRow.lesson.title,
      }
    : null;

  res.status(200).json({
    success: true,
    data: {
      enrolledCoursesCount,
      completedLessonsCount,
      inProgressCoursesCount,
      overallProgressPercent,
      continueLearning,
    },
  });
}

export async function getStudentMyCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;

  const [enrollments, pendingPayments] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.ACTIVE,
        course: { status: CourseStatus.PUBLISHED },
      },
      include: {
        course: { include: { category: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.paymentRequest.findMany({
      where: {
        studentId,
        status: PaymentRequestStatus.PENDING,
        course: { status: CourseStatus.PUBLISHED },
      },
      include: {
        course: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  const items = await Promise.all(
    enrollments.map(async (e) => {
      const courseId = e.courseId;
      const totalLessons = await prisma.lesson.count({
        where: { courseId, status: LessonStatus.PUBLISHED },
      });
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          enrollmentId: e.id,
          isCompleted: true,
        },
      });

      const lastProg = await prisma.lessonProgress.findFirst({
        where: { enrollmentId: e.id },
        orderBy: { lastWatchedAt: "desc" },
        include: {
          lesson: { select: { id: true, title: true } },
        },
      });

      const dto = mapCoursePublic({
        ...e.course,
        lessonCount: totalLessons,
      });

      return {
        kind: "enrolled" as const,
        enrollmentId: e.id,
        progressPercent: e.progressPercent,
        completedLessons,
        totalLessons,
        lastAccessedLesson: lastProg?.lesson
          ? {
              id: lastProg.lesson.id,
              title: lastProg.lesson.title,
            }
          : null,
        course: {
          id: dto.id,
          title: dto.title,
          slug: dto.slug,
          thumbnailUrl: dto.thumbnailUrl,
          category: dto.category,
          pricingType: dto.pricingType,
          level: dto.level,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
        },
      };
    }),
  );

  const pendingItems = pendingPayments
    .filter((p) => !enrolledCourseIds.has(p.courseId))
    .map((p) => {
      const dto = mapCoursePublic({
        ...p.course,
        lessonCount: 0,
      });
      return {
        kind: "pending_payment" as const,
        paymentRequestId: p.id,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 0,
        lastAccessedLesson: null,
        course: {
          id: dto.id,
          title: dto.title,
          slug: dto.slug,
          thumbnailUrl: dto.thumbnailUrl,
          category: dto.category,
          pricingType: dto.pricingType,
          level: dto.level,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
        },
      };
    });

  res.status(200).json({
    success: true,
    data: { items: [...pendingItems, ...items] },
  });
}

type SectionWithLessons = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    youtubeVideoId: string | null;
    youtubeUrl: string | null;
    sortOrder: number;
    isPreview: boolean;
    durationSeconds: number | null;
    progress: ReturnType<typeof mapLessonProgress>;
  }>;
};

export async function getStudentCourseLearn(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const courseSlug = String(
    (req.validatedParams as { courseSlug: string }).courseSlug,
  );
  const query = (req.validatedQuery ?? req.query) as {
    lessonId?: string;
  };
  const requestedLessonId =
    typeof query.lessonId === "string" ? query.lessonId : undefined;

  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: CourseStatus.PUBLISHED },
    include: {
      category: true,
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { status: LessonStatus.PUBLISHED },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
  }

  const { enrollment } = await assertStudentEnrollmentForPublishedCourse(
    studentId,
    course.id,
  );

  const orphanLessons = await prisma.lesson.findMany({
    where: {
      courseId: course.id,
      sectionId: null,
      status: LessonStatus.PUBLISHED,
    },
    orderBy: { sortOrder: "asc" },
  });

  const progressRows = await prisma.lessonProgress.findMany({
    where: { enrollmentId: enrollment.id },
  });
  const progressByLesson = new Map(
    progressRows.map((r) => [r.lessonId, r]),
  );

  const flat = flattenPublishedLessons(course.sections, orphanLessons);

  if (flat.length === 0) {
    throw new AppError(
      "NO_LESSONS",
      "لا توجد دروس منشورة في هذا الكورس بعد.",
      404,
    );
  }

  let currentIndex = 0;
  if (requestedLessonId) {
    const found = flat.findIndex((f) => f.lesson.id === requestedLessonId);
    if (found < 0) {
      throw new AppError(
        "NOT_FOUND",
        "الدرس غير موجود ضمن هذا الكورس.",
        404,
      );
    }
    currentIndex = found;
  } else {
    const firstIncomplete = flat.findIndex(
      (f) => !progressByLesson.get(f.lesson.id)?.isCompleted,
    );
    currentIndex = firstIncomplete >= 0 ? firstIncomplete : 0;
  }

  const current = flat[currentIndex]!;
  const prevId = currentIndex > 0 ? flat[currentIndex - 1]!.lesson.id : null;
  const nextId =
    currentIndex < flat.length - 1 ? flat[currentIndex + 1]!.lesson.id : null;

  const totalLessons = flat.length;
  const completedLessons = flat.filter((f) =>
    progressByLesson.get(f.lesson.id)?.isCompleted,
  ).length;

  const sectionsOut: SectionWithLessons[] = [];

  for (const sec of course.sections) {
    const lessonsOut = sec.lessons
      .filter((l) => l.status === LessonStatus.PUBLISHED)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((lesson) => {
        const pr = progressByLesson.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          description: trimDescription(lesson.description),
          youtubeVideoId: lesson.youtubeVideoId,
          youtubeUrl: lesson.youtubeUrl,
          sortOrder: lesson.sortOrder,
          isPreview: lesson.isPreview,
          durationSeconds: lesson.durationSeconds,
          progress: mapLessonProgress(
            pr ?? {
              watchedSeconds: 0,
              isCompleted: false,
              completedAt: null,
              lastWatchedAt: null,
            },
          ),
        };
      });
    if (lessonsOut.length > 0) {
      sectionsOut.push({
        id: sec.id,
        title: sec.title,
        sortOrder: sec.sortOrder,
        lessons: lessonsOut,
      });
    }
  }

  if (orphanLessons.length > 0) {
    sectionsOut.push({
      id: "__general__",
      title: "دروس عامة",
      sortOrder: 1_000_000,
      lessons: orphanLessons.map((lesson) => {
        const pr = progressByLesson.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          description: trimDescription(lesson.description),
          youtubeVideoId: lesson.youtubeVideoId,
          youtubeUrl: lesson.youtubeUrl,
          sortOrder: lesson.sortOrder,
          isPreview: lesson.isPreview,
          durationSeconds: lesson.durationSeconds,
          progress: mapLessonProgress(
            pr ?? {
              watchedSeconds: 0,
              isCompleted: false,
              completedAt: null,
              lastWatchedAt: null,
            },
          ),
        };
      }),
    });
  }

  const { sections: _sectionsDrop, ...courseForPublic } = course;
  const publicCourse = mapCoursePublic({
    ...courseForPublic,
    lessonCount: totalLessons,
  });

  res.status(200).json({
    success: true,
    data: {
      course: {
        id: publicCourse.id,
        title: publicCourse.title,
        slug: publicCourse.slug,
        shortDescription: publicCourse.shortDescription,
        description: trimDescription(course.description),
        thumbnailUrl: publicCourse.thumbnailUrl,
        level: publicCourse.level,
        estimatedDurationMinutes: publicCourse.estimatedDurationMinutes,
        category: publicCourse.category,
        pricingType: publicCourse.pricingType,
        progressPercent: enrollment.progressPercent,
      },
      sections: sectionsOut,
      navigation: {
        currentLessonId: current.lesson.id,
        previousLessonId: prevId,
        nextLessonId: nextId,
      },
      currentLesson: {
        id: current.lesson.id,
        title: current.lesson.title,
        description: trimDescription(current.lesson.description),
        youtubeVideoId: current.lesson.youtubeVideoId,
        youtubeUrl: current.lesson.youtubeUrl,
        durationSeconds: current.lesson.durationSeconds,
        isPreview: current.lesson.isPreview,
        sectionTitle: current.sectionTitle,
        progress: mapLessonProgress(
          progressByLesson.get(current.lesson.id) ?? {
            watchedSeconds: 0,
            isCompleted: false,
            completedAt: null,
            lastWatchedAt: null,
          },
        ),
      },
      stats: {
        completedLessons,
        totalLessons,
        progressPercent: enrollment.progressPercent,
      },
    },
  });
}

export async function postStudentLessonProgress(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const lessonId = String(
    (req.validatedParams as { lessonId: string }).lessonId,
  );
  const body = req.body as LessonProgressBody;

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      status: LessonStatus.PUBLISHED,
    },
    include: { course: true },
  });

  if (!lesson || lesson.course.status !== CourseStatus.PUBLISHED) {
    throw new AppError("NOT_FOUND", "الدرس غير متاح.", 404);
  }

  const { enrollment } = await assertStudentEnrollmentForPublishedCourse(
    studentId,
    lesson.courseId,
  );

  const watched =
    body.watchedSeconds === undefined
      ? undefined
      : Math.max(0, body.watchedSeconds);
  const now = new Date();

  const existing = await prisma.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      },
    },
  });

  const nextWatched =
    watched === undefined
      ? (existing?.watchedSeconds ?? 0)
      : Math.max(existing?.watchedSeconds ?? 0, watched);

  const row = await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      studentId,
      courseId: lesson.courseId,
      lessonId: lesson.id,
      watchedSeconds: nextWatched,
      isCompleted: false,
      lastWatchedAt: now,
    },
    update: {
      watchedSeconds: nextWatched,
      lastWatchedAt: now,
    },
  });

  const pct = await updateEnrollmentProgressPercent(
    enrollment.id,
    lesson.courseId,
  );

  const freshEnrollment = await prisma.enrollment.findUnique({
    where: { id: enrollment.id },
  });

  res.status(200).json({
    success: true,
    data: {
      lessonProgress: {
        lessonId: row.lessonId,
        ...mapLessonProgress(row),
      },
      enrollment: {
        progressPercent: freshEnrollment?.progressPercent ?? pct,
      },
    },
  });
}

export async function postStudentLessonComplete(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const lessonId = String(
    (req.validatedParams as { lessonId: string }).lessonId,
  );

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      status: LessonStatus.PUBLISHED,
    },
    include: { course: true },
  });

  if (!lesson || lesson.course.status !== CourseStatus.PUBLISHED) {
    throw new AppError("NOT_FOUND", "الدرس غير متاح.", 404);
  }

  const { enrollment } = await assertStudentEnrollmentForPublishedCourse(
    studentId,
    lesson.courseId,
  );

  const now = new Date();

  const prevProgress = await prisma.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      },
    },
  });

  const row = await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
      },
    },
    create: {
      enrollmentId: enrollment.id,
      studentId,
      courseId: lesson.courseId,
      lessonId: lesson.id,
      watchedSeconds: Math.max(
        lesson.durationSeconds ?? 0,
        0,
      ),
      isCompleted: true,
      completedAt: now,
      lastWatchedAt: now,
    },
    update: {
      isCompleted: true,
      completedAt: now,
      lastWatchedAt: now,
      watchedSeconds: Math.max(
        lesson.durationSeconds ?? 0,
        prevProgress?.watchedSeconds ?? 0,
      ),
    },
  });

  const pct = await updateEnrollmentProgressPercent(
    enrollment.id,
    lesson.courseId,
  );

  const freshEnrollment = await prisma.enrollment.findUnique({
    where: { id: enrollment.id },
  });

  res.status(200).json({
    success: true,
    data: {
      lessonProgress: {
        lessonId: row.lessonId,
        ...mapLessonProgress(row),
      },
      enrollment: {
        progressPercent: freshEnrollment?.progressPercent ?? pct,
      },
    },
  });
}

export async function getStudentCourseAccess(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const { courseSlug } = req.validatedParams as { courseSlug: string };

  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: CourseStatus.PUBLISHED },
    select: { id: true, slug: true, pricingType: true },
  });

  if (!course) {
    throw new AppError("COURSE_NOT_FOUND", "الكورس غير متاح أو غير منشور.", 404);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: course.id },
    },
    select: { id: true, status: true, progressPercent: true },
  });

  const pendingPaymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      studentId,
      courseId: course.id,
      status: PaymentRequestStatus.PENDING,
    },
    select: { id: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  const isEnrolled = enrollment?.status === EnrollmentStatus.ACTIVE;

  res.status(200).json({
    success: true,
    data: {
      courseId: course.id,
      isEnrolled,
      enrollmentId: isEnrolled ? enrollment!.id : null,
      progressPercent: enrollment?.progressPercent ?? 0,
      pendingPaymentRequest,
      canEnrollFree:
        course.pricingType === PricingType.FREE && !isEnrolled,
    },
  });
}

export async function enrollStudentInFreeCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const { courseSlug } = req.validatedParams as { courseSlug: string };

  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: CourseStatus.PUBLISHED },
    select: { id: true, slug: true, title: true, pricingType: true },
  });

  if (!course) {
    throw new AppError("COURSE_NOT_FOUND", "الكورس غير متاح أو غير منشور.", 404);
  }

  if (course.pricingType !== PricingType.FREE) {
    throw new AppError(
      "NOT_FREE_COURSE",
      "هذا الكورس مدفوع — استخدم طلب الدفع عبر CliQ أو رمز التفعيل.",
      400,
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: course.id },
    },
  });

  if (existing?.status === EnrollmentStatus.ACTIVE) {
    throw new AppError(
      "ALREADY_ENROLLED",
      "أنت مسجّل بالفعل في هذا الكورس.",
      409,
    );
  }

  let enrollment;
  if (existing) {
    enrollment = await prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        status: EnrollmentStatus.ACTIVE,
        source: EnrollmentSource.FREE,
        startedAt: existing.startedAt ?? new Date(),
        completedAt: null,
      },
    });
  } else {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId: course.id,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
        startedAt: new Date(),
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
      },
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
      },
    },
  });
}
