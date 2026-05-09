import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const courseStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const pricingTypeSchema = z.enum(["FREE", "PAID"]);

export const courseLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
]);

export const publicCoursesQuerySchema = paginationQuerySchema.extend({
  categorySlug: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const adminCoursesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: courseStatusSchema.optional(),
  pricingType: pricingTypeSchema.optional(),
});

export const courseSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[\p{L}\p{N}_\-]+$/u, "مسار الكورس غير صالح."),
});

export const courseIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const courseCreateBodySchema = z
  .object({
    title: z.string().trim().min(3, "العنوان قصير جدًا."),
    slug: z
      .string()
      .trim()
      .regex(/^[\p{L}\p{N}_\-]+$/u, "المعرّف غير صالح.")
      .optional(),
    description: z.string().trim().min(10, "الوصف مطلوب."),
    shortDescription: z.string().trim().max(500).optional(),
    thumbnailUrl: z.union([z.string().url(), z.literal("")]).optional(),
    categoryId: z.preprocess(
      (v) => (v === "" ? null : v),
      z.union([z.string().cuid(), z.null()]).optional(),
    ),
    pricingType: pricingTypeSchema,
    priceAmount: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).default("JOD"),
    level: courseLevelSchema.default("ALL_LEVELS"),
    estimatedDurationMinutes: z.coerce.number().int().min(0).max(100000).optional(),
    status: courseStatusSchema.default("DRAFT"),
  })
  .superRefine((data, ctx) => {
    if (data.pricingType === "PAID") {
      if (data.priceAmount === undefined || Number.isNaN(data.priceAmount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "المبلغ مطلوب للكورسات المدفوعة.",
          path: ["priceAmount"],
        });
      }
    }
  });

export type CourseCreateBody = z.infer<typeof courseCreateBodySchema>;

export const courseUpdateBodySchema = z.object({
  title: z.string().trim().min(3).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[\p{L}\p{N}_\-]+$/u)
    .optional(),
  description: z.string().trim().min(10).optional(),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  thumbnailUrl: z
    .union([z.string().url(), z.literal("")])
    .nullable()
    .optional(),
  categoryId: z.preprocess(
    (v) => (v === "" ? null : v),
    z.union([z.string().cuid(), z.null()]).optional(),
  ),
  pricingType: pricingTypeSchema.optional(),
  priceAmount: z.coerce.number().positive().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  level: courseLevelSchema.optional(),
  estimatedDurationMinutes: z
    .coerce.number()
    .int()
    .min(0)
    .max(100000)
    .nullable()
    .optional(),
  status: courseStatusSchema.optional(),
});

export type CourseUpdateBody = z.infer<typeof courseUpdateBodySchema>;
