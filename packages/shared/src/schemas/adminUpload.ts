import { z } from "zod";

export const courseThumbnailUploadBodySchema = z.object({
  imageBase64: z
    .string()
    .trim()
    .min(22, "صورة الغلاف مطلوبة."),
});

export type CourseThumbnailUploadBody = z.infer<
  typeof courseThumbnailUploadBodySchema
>;

export const lessonResourceUploadBodySchema = z.object({
  fileBase64: z
    .string()
    .trim()
    .min(22, "الملف مطلوب."),
  fileName: z.string().trim().max(255).optional(),
});

export type LessonResourceUploadBody = z.infer<
  typeof lessonResourceUploadBodySchema
>;
