import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const categoryCreateBodySchema = z.object({
  name: z.string().trim().min(2, "اسم التصنيف قصير جدًا."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "المعرّف غير صالح.")
    .optional(),
  description: z.string().trim().max(2000).optional(),
});

export type CategoryCreateBody = z.infer<typeof categoryCreateBodySchema>;

export const categoryUpdateBodySchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
    .optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export type CategoryUpdateBody = z.infer<typeof categoryUpdateBodySchema>;

export const categoryIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const publicCategoriesQuerySchema = paginationQuerySchema;

/** لوحة الإدارة: نشط فقط، مؤرشف فقط، أو الكل */
export const adminCategoriesScopeSchema = z.enum(["active", "archived", "all"]);

export const adminCategoriesQuerySchema = paginationQuerySchema.extend({
  scope: adminCategoriesScopeSchema.optional().default("all"),
});

export type AdminCategoriesQuery = z.infer<typeof adminCategoriesQuerySchema>;
