import { z } from "zod";

import { courseIdParamsSchema } from "./course";

export const studentSavedCourseItemSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  savedAt: z.string().datetime(),
  course: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    thumbnailUrl: z.string().nullable(),
    pricingType: z.enum(["FREE", "PAID"]),
    priceAmount: z.string().nullable(),
    currency: z.string(),
    level: z.string(),
    category: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      })
      .nullable(),
  }),
  isEnrolled: z.boolean(),
  canLearn: z.boolean(),
  learnUrl: z.string().nullable(),
});

export const studentSavedCoursesResponseSchema = z.object({
  items: z.array(studentSavedCourseItemSchema),
});

export const studentSavedCourseIdsResponseSchema = z.object({
  courseIds: z.array(z.string()),
});

export { courseIdParamsSchema as studentSavedCourseIdParamsSchema };

export type StudentSavedCourseItem = z.infer<
  typeof studentSavedCourseItemSchema
>;
