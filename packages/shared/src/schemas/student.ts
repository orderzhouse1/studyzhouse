import { z } from "zod";

export const studentCourseSlugParamsSchema = z.object({
  courseSlug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[\p{L}\p{N}_\-]+$/u, "مسار الكورس غير صالح."),
});

export const studentLearnQuerySchema = z.object({
  lessonId: z.string().cuid().optional(),
});

export const lessonIdParamsSchema = z.object({
  lessonId: z.string().cuid(),
});

export const lessonProgressBodySchema = z.object({
  watchedSeconds: z.coerce.number().int().min(0).max(86400).optional(),
});

export type LessonProgressBody = z.infer<typeof lessonProgressBodySchema>;

/** جسم POST فارغ مقبول */
export const emptyBodySchema = z.object({});
