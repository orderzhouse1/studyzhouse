import type { Request } from "express";
import { CourseStatus, LessonStatus } from "@prisma/client";

import type {
  LessonNoteCreateBody,
  LessonNoteItem,
  LessonNotePatchBody,
} from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import {
  assertStudentEnrollmentForPublishedCourse,
} from "./studentLearning.service.js";

function mapNote(row: {
  id: string;
  lessonId: string;
  courseId: string;
  body: string;
  timestampSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}): LessonNoteItem {
  return {
    id: row.id,
    lessonId: row.lessonId,
    courseId: row.courseId,
    body: row.body,
    timestampSeconds: row.timestampSeconds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertLessonAccessForStudent(
  studentId: string,
  lessonId: string,
): Promise<{ lessonId: string; courseId: string }> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      status: LessonStatus.PUBLISHED,
      course: { status: CourseStatus.PUBLISHED },
    },
    select: { id: true, courseId: true },
  });

  if (!lesson) {
    throw new AppError("NOT_FOUND", "الدرس غير متاح.", 404);
  }

  await assertStudentEnrollmentForPublishedCourse(studentId, lesson.courseId);

  return { lessonId: lesson.id, courseId: lesson.courseId };
}

export async function listLessonNotesForStudent(
  studentId: string,
  lessonId: string,
): Promise<LessonNoteItem[]> {
  await assertLessonAccessForStudent(studentId, lessonId);

  const rows = await prisma.lessonNote.findMany({
    where: { studentId, lessonId },
    orderBy: [{ timestampSeconds: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(mapNote);
}

export async function createLessonNoteForStudent(
  studentId: string,
  lessonId: string,
  body: LessonNoteCreateBody,
): Promise<LessonNoteItem> {
  const access = await assertLessonAccessForStudent(studentId, lessonId);

  const created = await prisma.lessonNote.create({
    data: {
      studentId,
      lessonId: access.lessonId,
      courseId: access.courseId,
      body: body.body.trim(),
      timestampSeconds: body.timestampSeconds ?? null,
    },
  });

  return mapNote(created);
}

export async function patchLessonNoteForStudent(
  studentId: string,
  noteId: string,
  body: LessonNotePatchBody,
): Promise<LessonNoteItem> {
  const existing = await prisma.lessonNote.findFirst({
    where: { id: noteId, studentId },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "الملاحظة غير موجودة.", 404);
  }

  await assertStudentEnrollmentForPublishedCourse(
    studentId,
    existing.courseId,
  );

  const updated = await prisma.lessonNote.update({
    where: { id: existing.id },
    data: {
      body: body.body?.trim(),
      timestampSeconds:
        body.timestampSeconds === undefined
          ? undefined
          : body.timestampSeconds,
    },
  });

  return mapNote(updated);
}

export async function deleteLessonNoteForStudent(
  studentId: string,
  noteId: string,
): Promise<void> {
  const existing = await prisma.lessonNote.findFirst({
    where: { id: noteId, studentId },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "الملاحظة غير موجودة.", 404);
  }

  await prisma.lessonNote.delete({ where: { id: existing.id } });
}

export async function getLessonNoteForAudit(
  noteId: string,
): Promise<{
  id: string;
  body: string;
  timestampSeconds: number | null;
} | null> {
  const row = await prisma.lessonNote.findUnique({
    where: { id: noteId },
    select: { id: true, body: true, timestampSeconds: true },
  });
  return row;
}
