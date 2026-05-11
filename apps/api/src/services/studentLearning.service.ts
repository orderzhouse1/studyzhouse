import type { Course, CourseSection, Lesson } from "@prisma/client";
import {
  CourseStatus,
  EnrollmentStatus,
  LessonStatus,
  Prisma,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";

export type FlatLessonRef = {
  lesson: Lesson;
  sectionId: string | null;
  sectionTitle: string | null;
  globalIndex: number;
};

export function flattenPublishedLessons(
  sections: (CourseSection & { lessons: Lesson[] })[],
  orphanLessons: Lesson[],
): FlatLessonRef[] {
  const out: FlatLessonRef[] = [];
  let idx = 0;
  for (const sec of sections) {
    const published = sec.lessons.filter(
      (l) => l.status === LessonStatus.PUBLISHED,
    );
    for (const lesson of published.sort((a, b) => a.sortOrder - b.sortOrder)) {
      out.push({
        lesson,
        sectionId: sec.id,
        sectionTitle: sec.title,
        globalIndex: idx++,
      });
    }
  }
  const orphans = orphanLessons
    .filter((l) => l.status === LessonStatus.PUBLISHED)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  for (const lesson of orphans) {
    out.push({
      lesson,
      sectionId: null,
      sectionTitle: null,
      globalIndex: idx++,
    });
  }
  return out;
}

export async function assertStudentEnrollmentForPublishedCourse(
  studentId: string,
  courseId: string,
): Promise<{
  enrollment: Prisma.EnrollmentGetPayload<object>;
  course: Course;
}> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير متاح أو غير منشور.", 404);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
    },
  });
  if (!enrollment) {
    throw new AppError(
      "FORBIDDEN",
      "أنت غير مسجّل في هذا الكورس.",
      403,
    );
  }

  return { enrollment, course };
}

export async function countPublishedLessons(courseId: string): Promise<number> {
  return prisma.lesson.count({
    where: { courseId, status: LessonStatus.PUBLISHED },
  });
}

export async function updateEnrollmentProgressPercent(
  enrollmentId: string,
  courseId: string,
): Promise<number> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });
  if (!enrollment) return 0;

  const total = await countPublishedLessons(courseId);
  if (total === 0) {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progressPercent: 0 },
    });
    return 0;
  }
  const completed = await prisma.lessonProgress.count({
    where: { enrollmentId, isCompleted: true },
  });
  const pct = Math.min(100, Math.round((completed / total) * 100));
  const allDone = completed >= total && total > 0;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent: pct,
      startedAt: enrollment.startedAt ?? new Date(),
      ...(allDone ? { completedAt: new Date() } : {}),
    },
  });
  return pct;
}
