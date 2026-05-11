import type { Request, Response } from "express";
import type { Category, Course } from "@prisma/client";
import { LessonStatus } from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { assertCanManageCourse } from "../lib/courseAccess.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import { getStructureCoursePayload } from "../services/courseStructurePayload.service.js";
import type {
  LessonCreateBody,
  LessonUpdateBody,
  LessonsReorderBody,
  SectionCreateBody,
  SectionUpdateBody,
  SectionsReorderBody,
} from "@studyhouse/shared";
import {
  normalizeYoutubeWatchUrl,
  parseYoutubeVideoId,
} from "@studyhouse/shared";

type CourseWithCategory = Course & { category: Category | null };

async function loadCourseForManage(courseId: string): Promise<CourseWithCategory> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { category: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  return course;
}

function youtubePayloadFromUrl(url: string | undefined | null): {
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
} {
  if (url === undefined || url === null) {
    return { youtubeVideoId: null, youtubeUrl: null };
  }
  const t = url.trim();
  if (t === "") {
    return { youtubeVideoId: null, youtubeUrl: null };
  }
  const id = parseYoutubeVideoId(t);
  if (!id) {
    throw new AppError(
      "VALIDATION_ERROR",
      "تعذّر التعرف على رابط يوتيوب.",
      400,
    );
  }
  return {
    youtubeVideoId: id,
    youtubeUrl: normalizeYoutubeWatchUrl(id),
  };
}

export async function getCourseStructureAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ?? req.params.courseId,
  );
  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({
    success: true,
    data: structure,
  });
}

export async function createSectionAdmin(req: Request, res: Response): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ?? req.params.courseId,
  );
  const body = req.body as SectionCreateBody;
  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const agg = await prisma.courseSection.aggregate({
    where: { courseId },
    _max: { sortOrder: true },
  });
  const nextOrder =
    body.order != null
      ? body.order
      : agg._max.sortOrder === null
        ? 0
        : agg._max.sortOrder + 1;

  const created = await prisma.courseSection.create({
    data: {
      courseId,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      sortOrder: nextOrder,
    },
  });

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "SECTION_CREATE",
    entityType: "CourseSection",
    entityId: created.id,
    metadata: { courseId, sortOrder: created.sortOrder },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(201).json({ success: true, data: structure });
}

export async function updateSectionAdmin(req: Request, res: Response): Promise<void> {
  const params = req.validatedParams as {
    courseId: string;
    sectionId: string;
  };
  const courseId = params.courseId;
  const sectionId = params.sectionId;
  const body = req.body as SectionUpdateBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) {
    throw new AppError("NOT_FOUND", "القسم غير موجود.", 404);
  }

  await prisma.courseSection.update({
    where: { id: section.id },
    data: {
      title: body.title?.trim() ?? undefined,
      description:
        body.description === undefined ? undefined : body.description?.trim() ?? null,
    },
  });

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "SECTION_UPDATE",
    entityType: "CourseSection",
    entityId: sectionId,
    metadata: { courseId },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}

export async function deleteSectionAdmin(req: Request, res: Response): Promise<void> {
  const params = req.validatedParams as {
    courseId: string;
    sectionId: string;
  };
  const courseId = params.courseId;
  const sectionId = params.sectionId;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) {
    throw new AppError("NOT_FOUND", "القسم غير موجود.", 404);
  }

  await prisma.$transaction([
    prisma.lesson.deleteMany({ where: { sectionId } }),
    prisma.courseSection.delete({ where: { id: sectionId } }),
  ]);

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "SECTION_DELETE",
    entityType: "CourseSection",
    entityId: sectionId,
    metadata: { courseId },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}

export async function reorderSectionsAdmin(req: Request, res: Response): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ?? req.params.courseId,
  );
  const body = req.body as SectionsReorderBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const existing = await prisma.courseSection.findMany({
    where: { courseId },
    select: { id: true },
  });
  const idSet = new Set(existing.map((s) => s.id));
  if (
    body.orderedSectionIds.length !== existing.length ||
    !body.orderedSectionIds.every((id) => idSet.has(id))
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "ترتيب الأقسام لا يطابق البيانات الحالية.",
      400,
    );
  }

  await prisma.$transaction(
    body.orderedSectionIds.map((id, idx) =>
      prisma.courseSection.update({
        where: { id },
        data: { sortOrder: idx },
      }),
    ),
  );

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "SECTIONS_REORDER",
    entityType: "Course",
    entityId: courseId,
    metadata: { orderedSectionIds: body.orderedSectionIds },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}

export async function createLessonAdmin(req: Request, res: Response): Promise<void> {
  const params = req.validatedParams as {
    courseId: string;
    sectionId: string;
  };
  const courseId = params.courseId;
  const sectionId = params.sectionId;
  const body = req.body as LessonCreateBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) {
    throw new AppError("NOT_FOUND", "القسم غير موجود.", 404);
  }

  const yt = youtubePayloadFromUrl(body.youtubeUrl);

  const agg = await prisma.lesson.aggregate({
    where: { courseId, sectionId },
    _max: { sortOrder: true },
  });
  const nextOrder =
    body.order != null
      ? body.order
      : agg._max.sortOrder === null
        ? 0
        : agg._max.sortOrder + 1;

  const durationSeconds =
    body.durationMinutes !== undefined
      ? Math.round(body.durationMinutes * 60)
      : null;

  const created = await prisma.lesson.create({
    data: {
      courseId,
      sectionId,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      youtubeVideoId: yt.youtubeVideoId,
      youtubeUrl: yt.youtubeUrl,
      durationSeconds,
      isPreview: body.isPreview ?? false,
      sortOrder: nextOrder,
      status: LessonStatus.DRAFT,
    },
  });

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "LESSON_CREATE",
    entityType: "Lesson",
    entityId: created.id,
    metadata: { courseId, sectionId },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(201).json({ success: true, data: structure });
}

export async function updateLessonAdmin(req: Request, res: Response): Promise<void> {
  const params = req.validatedParams as {
    courseId: string;
    lessonId: string;
  };
  const courseId = params.courseId;
  const lessonId = params.lessonId;
  const body = req.body as LessonUpdateBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
  });
  if (!lesson) {
    throw new AppError("NOT_FOUND", "الدرس غير موجود.", 404);
  }

  let youtubeVideoId: string | null | undefined = undefined;
  let youtubeUrl: string | null | undefined = undefined;

  if (body.youtubeUrl !== undefined) {
    const payload = youtubePayloadFromUrl(body.youtubeUrl);
    youtubeVideoId = payload.youtubeVideoId;
    youtubeUrl = payload.youtubeUrl;
  }

  const durationSeconds =
    body.durationMinutes === undefined
      ? undefined
      : body.durationMinutes === null
        ? null
        : Math.round(body.durationMinutes * 60);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      title: body.title?.trim() ?? undefined,
      description:
        body.description === undefined ? undefined : body.description?.trim() ?? null,
      youtubeVideoId,
      youtubeUrl,
      durationSeconds,
      isPreview: body.isPreview ?? undefined,
    },
  });

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "LESSON_UPDATE",
    entityType: "Lesson",
    entityId: lessonId,
    metadata: { courseId },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}

export async function deleteLessonAdmin(req: Request, res: Response): Promise<void> {
  const params = req.validatedParams as {
    courseId: string;
    lessonId: string;
  };
  const courseId = params.courseId;
  const lessonId = params.lessonId;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
  });
  if (!lesson) {
    throw new AppError("NOT_FOUND", "الدرس غير موجود.", 404);
  }

  await prisma.lesson.delete({ where: { id: lessonId } });

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "LESSON_DELETE",
    entityType: "Lesson",
    entityId: lessonId,
    metadata: { courseId },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}

export async function reorderLessonsAdmin(req: Request, res: Response): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ?? req.params.courseId,
  );
  const body = req.body as LessonsReorderBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const section = await prisma.courseSection.findFirst({
    where: { id: body.sectionId, courseId },
  });
  if (!section) {
    throw new AppError("NOT_FOUND", "القسم غير موجود.", 404);
  }

  const existing = await prisma.lesson.findMany({
    where: { courseId, sectionId: body.sectionId },
    select: { id: true },
  });
  const idSet = new Set(existing.map((l) => l.id));
  if (
    body.orderedLessonIds.length !== existing.length ||
    !body.orderedLessonIds.every((id) => idSet.has(id))
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "ترتيب الدروس لا يطابق البيانات الحالية.",
      400,
    );
  }

  await prisma.$transaction(
    body.orderedLessonIds.map((id, idx) =>
      prisma.lesson.update({
        where: { id },
        data: { sortOrder: idx },
      }),
    ),
  );

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "LESSONS_REORDER",
    entityType: "Course",
    entityId: courseId,
    metadata: {
      sectionId: body.sectionId,
      orderedLessonIds: body.orderedLessonIds,
    },
    req,
  });

  const structure = await getStructureCoursePayload(courseId);
  res.status(200).json({ success: true, data: structure });
}
