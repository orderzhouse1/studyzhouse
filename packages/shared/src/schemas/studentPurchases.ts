import { z } from "zod";

export const studentPurchaseSourceSchema = z.enum([
  "CLIQ_PAYMENT",
  "ACTIVATION_CODE",
  "MANUAL_ADMIN",
  "FREE",
  "MANUAL",
  "UNKNOWN",
]);

export const studentPurchaseStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "REVOKED",
  "COMPLETED",
]);

export const studentPurchaseItemSchema = z.object({
  id: z.string(),
  source: studentPurchaseSourceSchema,
  status: studentPurchaseStatusSchema,
  course: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
  amount: z.string().nullable(),
  currency: z.string().nullable(),
  transactionReference: z.string().nullable(),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  canLearn: z.boolean(),
  learnUrl: z.string().nullable(),
});

export const studentPurchasesResponseSchema = z.object({
  items: z.array(studentPurchaseItemSchema),
});

export type StudentPurchaseSource = z.infer<typeof studentPurchaseSourceSchema>;
export type StudentPurchaseStatus = z.infer<typeof studentPurchaseStatusSchema>;
export type StudentPurchaseItem = z.infer<typeof studentPurchaseItemSchema>;
