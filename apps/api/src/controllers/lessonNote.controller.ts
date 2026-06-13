import type { Request, Response } from "express";

import type {
  LessonNoteCreateBody,
  LessonNotePatchBody,
} from "@studyhouse/shared";
import {
  lessonIdParamsSchema,
  lessonNoteIdParamsSchema,
} from "@studyhouse/shared";
import { AppError } from "../lib/AppError.js";
import { writeAuditLog } from "../services/audit.service.js";
import {
  createLessonNoteForStudent,
  deleteLessonNoteForStudent,
  getLessonNoteForAudit,
  listLessonNotesForStudent,
  patchLessonNoteForStudent,
} from "../services/lessonNote.service.js";

function requireStudentId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function listLessonNotesStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { lessonId } = lessonIdParamsSchema.parse(req.params);
  const items = await listLessonNotesForStudent(studentId, lessonId);

  res.status(200).json({
    success: true,
    data: { items },
  });
}

export async function createLessonNoteStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { lessonId } = lessonIdParamsSchema.parse(req.params);
  const body = req.body as LessonNoteCreateBody;

  const created = await createLessonNoteForStudent(studentId, lessonId, body);

  await writeAuditLog({
    actorId: studentId,
    action: "LESSON_NOTE_CREATE",
    entityType: "LessonNote",
    entityId: created.id,
    metadata: { lessonId, courseId: created.courseId },
    afterJson: {
      body: created.body,
      timestampSeconds: created.timestampSeconds,
    },
    req,
  });

  res.status(201).json({
    success: true,
    data: created,
  });
}

export async function patchLessonNoteStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { noteId } = lessonNoteIdParamsSchema.parse(req.params);
  const body = req.body as LessonNotePatchBody;

  const before = await getLessonNoteForAudit(noteId);
  const updated = await patchLessonNoteForStudent(studentId, noteId, body);

  await writeAuditLog({
    actorId: studentId,
    action: "LESSON_NOTE_UPDATE",
    entityType: "LessonNote",
    entityId: noteId,
    beforeJson: before
      ? {
          body: before.body,
          timestampSeconds: before.timestampSeconds,
        }
      : null,
    afterJson: {
      body: updated.body,
      timestampSeconds: updated.timestampSeconds,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteLessonNoteStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { noteId } = lessonNoteIdParamsSchema.parse(req.params);

  const before = await getLessonNoteForAudit(noteId);
  await deleteLessonNoteForStudent(studentId, noteId);

  await writeAuditLog({
    actorId: studentId,
    action: "LESSON_NOTE_DELETE",
    entityType: "LessonNote",
    entityId: noteId,
    beforeJson: before
      ? {
          body: before.body,
          timestampSeconds: before.timestampSeconds,
        }
      : null,
    req,
  });

  res.status(200).json({
    success: true,
    data: { deleted: true },
  });
}
