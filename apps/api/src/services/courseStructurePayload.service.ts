import type { Course, CourseSection, Lesson } from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { computePublishReadiness } from "./courseReadiness.service.js";

function mapLessonRow(l: Lesson) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    youtubeUrl: l.youtubeUrl,
    youtubeVideoId: l.youtubeVideoId,
    durationSeconds: l.durationSeconds,
    isPreview: l.isPreview,
    order: l.sortOrder,
  };
}

function mapSectionRow(s: CourseSection & { lessons: Lesson[] }) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    order: s.sortOrder,
    lessons: s.lessons.map(mapLessonRow),
  };
}

/** استجابة هيكل الكورس للبناء — يُستدعى بعد أي تعديل على الأقسام/الدروس */
export async function getStructureCoursePayload(courseId: string): Promise<{
  course: {
    id: string;
    title: string;
    slug: string;
    status: Course["status"];
    pricingType: Course["pricingType"];
    category: null | { id: string; name: string; slug: string };
    sections: ReturnType<typeof mapSectionRow>[];
    readiness: ReturnType<typeof computePublishReadiness>;
  };
}> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { category: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  const sections = await prisma.courseSection.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const readiness = computePublishReadiness(course, sections);

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      pricingType: course.pricingType,
      category: course.category
        ? {
            id: course.category.id,
            name: course.category.name,
            slug: course.category.slug,
          }
        : null,
      sections: sections.map(mapSectionRow),
      readiness,
    },
  };
}
