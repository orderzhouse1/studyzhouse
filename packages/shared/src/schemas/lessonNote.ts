import { z } from "zod";

export const lessonNoteIdParamsSchema = z.object({
  noteId: z.string().cuid(),
});

export const lessonNoteCreateBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "نص الملاحظة مطلوب.")
    .max(4000, "الملاحظة طويلة جدًا."),
  timestampSeconds: z.coerce
    .number()
    .int()
    .min(0, "الوقت غير صالح.")
    .max(86400, "الوقت طويل جدًا.")
    .optional(),
});

export type LessonNoteCreateBody = z.infer<typeof lessonNoteCreateBodySchema>;

export const lessonNotePatchBodySchema = z
  .object({
    body: z.string().trim().min(1).max(4000).optional(),
    timestampSeconds: z.coerce.number().int().min(0).max(86400).nullable().optional(),
  })
  .refine((d) => d.body !== undefined || d.timestampSeconds !== undefined, {
    message: "لا يوجد شيء للتحديث.",
  });

export type LessonNotePatchBody = z.infer<typeof lessonNotePatchBodySchema>;

export const lessonNoteItemSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  courseId: z.string(),
  body: z.string(),
  timestampSeconds: z.number().int().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type LessonNoteItem = z.infer<typeof lessonNoteItemSchema>;
