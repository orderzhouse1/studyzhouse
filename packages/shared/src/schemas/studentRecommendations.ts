import { z } from "zod";

export const studentRecommendationReasonSchema = z.enum([
  "INTEREST",
  "ENROLLED_CATEGORY",
  "SAVED_CATEGORY",
  "TOP_RATED",
  "POPULAR",
  "NEW",
]);

export type StudentRecommendationReason = z.infer<
  typeof studentRecommendationReasonSchema
>;

export const studentRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export type StudentRecommendationsQuery = z.infer<
  typeof studentRecommendationsQuerySchema
>;

export const studentRecommendationCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  thumbnailUrl: z.string().nullable(),
  pricingType: z.enum(["FREE", "PAID"]),
  priceAmount: z.string().nullable(),
  currency: z.string(),
  level: z.string(),
  estimatedDurationMinutes: z.number().int().nullable().optional(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  averageRating: z.number().nullable(),
  reviewCount: z.number().int().min(0),
});

export const studentRecommendationItemSchema = z.object({
  course: studentRecommendationCourseSchema,
  reason: studentRecommendationReasonSchema,
  reasonLabelAr: z.string(),
  score: z.number(),
});

export type StudentRecommendationItem = z.infer<
  typeof studentRecommendationItemSchema
>;

export const studentRecommendationDismissParamsSchema = z.object({
  courseId: z.string().cuid(),
});

export type StudentRecommendationDismissParams = z.infer<
  typeof studentRecommendationDismissParamsSchema
>;
