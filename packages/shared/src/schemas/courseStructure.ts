import { z } from "zod";

import { parseYoutubeVideoId } from "../youtube";

export const adminCourseParamsSchema = z.object({
  courseId: z.string().cuid(),
});

export const adminCourseSectionParamsSchema = adminCourseParamsSchema.extend({
  sectionId: z.string().cuid(),
});

export const adminCourseLessonParamsSchema = adminCourseParamsSchema.extend({
  lessonId: z.string().cuid(),
});

export const sectionCreateBodySchema = z.object({
  title: z.string().trim().min(2, "عنوان القسم قصير جدًا."),
  description: z.string().trim().max(8000).optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export type SectionCreateBody = z.infer<typeof sectionCreateBodySchema>;

export const sectionUpdateBodySchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().max(8000).nullable().optional(),
});

export type SectionUpdateBody = z.infer<typeof sectionUpdateBodySchema>;

export const sectionsReorderBodySchema = z.object({
  orderedSectionIds: z
    .array(z.string().cuid())
    .min(1, "يجب إرسال ترتيب الأقسام."),
});

export type SectionsReorderBody = z.infer<typeof sectionsReorderBodySchema>;

/** رابط يوتيوب اختياري؛ إن وُجد يجب أن يُستخرج منه معرف صالح */
export const lessonCreateBodySchema = z
  .object({
    title: z.string().trim().min(2, "عنوان الدرس قصير جدًا."),
    description: z.string().trim().max(8000).optional(),
    youtubeUrl: z.string().trim().optional(),
    durationMinutes: z.coerce.number().min(0).max(600).optional(),
    isPreview: z.boolean().optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const url = data.youtubeUrl?.trim();
    if (!url) return;
    try {
      void new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "رابط الفيديو غير صالح.",
        path: ["youtubeUrl"],
      });
      return;
    }
    const id = parseYoutubeVideoId(url);
    if (!id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تعذّر التعرف على رابط يوتيوب.",
        path: ["youtubeUrl"],
      });
    }
  });

export type LessonCreateBody = z.infer<typeof lessonCreateBodySchema>;

export const lessonUpdateBodySchema = z
  .object({
    title: z.string().trim().min(2).optional(),
    description: z.string().trim().max(8000).nullable().optional(),
    youtubeUrl: z.string().trim().nullable().optional(),
    durationMinutes: z.coerce.number().min(0).max(600).nullable().optional(),
    isPreview: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.youtubeUrl === undefined || data.youtubeUrl === null) return;
    const url = data.youtubeUrl.trim();
    if (url === "") return;
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "رابط الفيديو غير صالح.",
        path: ["youtubeUrl"],
      });
      return;
    }
    const id = parseYoutubeVideoId(url);
    if (!id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تعذّر التعرف على رابط يوتيوب.",
        path: ["youtubeUrl"],
      });
    }
  });

export type LessonUpdateBody = z.infer<typeof lessonUpdateBodySchema>;

export const lessonsReorderBodySchema = z.object({
  sectionId: z.string().cuid(),
  orderedLessonIds: z
    .array(z.string().cuid())
    .min(1, "يجب إرسال ترتيب الدروس."),
});

export type LessonsReorderBody = z.infer<typeof lessonsReorderBodySchema>;
