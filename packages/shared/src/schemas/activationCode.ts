import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const activationCodeStatusSchema = z.enum(["ACTIVE", "DISABLED", "EXPIRED"]);

export const adminActivationCodesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: activationCodeStatusSchema.optional(),
  courseId: z.string().cuid().optional(),
});

export type AdminActivationCodesQuery = z.infer<
  typeof adminActivationCodesQuerySchema
>;

export const activationCodeIdParamsSchema = z.object({
  codeId: z.string().cuid(),
});

export const adminActivationCodeCreateBodySchema = z
  .object({
    courseId: z.string().cuid(),
    usageLimit: z.coerce.number().int().min(1).max(100000),
    expiresAt: z.coerce.date().optional(),
    note: z.string().trim().max(1000).optional(),
    count: z.coerce.number().int().min(1).max(50).optional().default(1),
  })
  .superRefine((data, ctx) => {
    if (data.expiresAt && data.expiresAt.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تاريخ الانتهاء يجب أن يكون في المستقبل.",
        path: ["expiresAt"],
      });
    }
  });

export type AdminActivationCodeCreateBody = z.infer<
  typeof adminActivationCodeCreateBodySchema
>;

export const adminActivationCodeUpdateBodySchema = z
  .object({
    usageLimit: z.coerce.number().int().min(1).max(100000).optional(),
    expiresAt: z.union([z.coerce.date(), z.null()]).optional(),
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (d) =>
      d.usageLimit !== undefined ||
      d.expiresAt !== undefined ||
      d.note !== undefined,
    { message: "لا يوجد شيء للتحديث." },
  );

export type AdminActivationCodeUpdateBody = z.infer<
  typeof adminActivationCodeUpdateBodySchema
>;

export const studentActivationRedeemBodySchema = z.object({
  code: z.string().trim().min(6, "أدخل الكود."),
  /** عند التفعيل من صفحة كورس — يُرفض الكود إن كان لكورس آخر */
  courseId: z.string().cuid().optional(),
});

export type StudentActivationRedeemBody = z.infer<
  typeof studentActivationRedeemBodySchema
>;
