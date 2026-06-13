import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const courseReviewStatusSchema = z.enum([
  "PENDING",
  "PUBLISHED",
  "HIDDEN",
]);

export type CourseReviewStatus = z.infer<typeof courseReviewStatusSchema>;

export const courseRatingSummarySchema = z.object({
  averageRating: z.number().nullable(),
  reviewCount: z.number().int().min(0),
});

export type CourseRatingSummary = z.infer<typeof courseRatingSummarySchema>;

export const courseReviewCreateBodySchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "التقييم من 1 إلى 5.")
    .max(5, "التقييم من 1 إلى 5."),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export type CourseReviewCreateBody = z.infer<
  typeof courseReviewCreateBodySchema
>;

export const courseReviewPatchBodySchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().trim().max(120).nullable().optional(),
    comment: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (d) =>
      d.rating !== undefined ||
      d.title !== undefined ||
      d.comment !== undefined,
    { message: "لا يوجد شيء للتحديث." },
  );

export type CourseReviewPatchBody = z.infer<typeof courseReviewPatchBodySchema>;

export const courseReviewIdParamsSchema = z.object({
  reviewId: z.string().cuid(),
});

export const publicCourseReviewItemSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  createdAt: z.string().datetime(),
  student: z.object({
    fullName: z.string(),
  }),
});

export type PublicCourseReviewItem = z.infer<
  typeof publicCourseReviewItemSchema
>;

export const studentCourseReviewItemSchema = publicCourseReviewItemSchema.extend({
  status: courseReviewStatusSchema,
  updatedAt: z.string().datetime(),
});

export type StudentCourseReviewItem = z.infer<
  typeof studentCourseReviewItemSchema
>;

export const adminCourseReviewItemSchema = studentCourseReviewItemSchema.extend({
  course: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
  student: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
  }),
});

export type AdminCourseReviewItem = z.infer<typeof adminCourseReviewItemSchema>;

export const adminReviewsQuerySchema = paginationQuerySchema.extend({
  status: courseReviewStatusSchema.optional(),
  courseId: z.string().cuid().optional(),
  search: z.string().trim().min(1).optional(),
});

export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;

export const adminReviewStatusPatchBodySchema = z.object({
  status: courseReviewStatusSchema,
});

export type AdminReviewStatusPatchBody = z.infer<
  typeof adminReviewStatusPatchBodySchema
>;

export const publicCourseReviewsQuerySchema = paginationQuerySchema;
