import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const paymentRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export type PaymentRequestStatusFilter = z.infer<
  typeof paymentRequestStatusSchema
>;

export const adminPaymentRequestsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: paymentRequestStatusSchema.optional(),
  courseId: z.string().cuid().optional(),
});

export type AdminPaymentRequestsQuery = z.infer<
  typeof adminPaymentRequestsQuerySchema
>;

export const paymentRequestIdParamsSchema = z.object({
  paymentRequestId: z.string().cuid(),
});

const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "صيغة المبلغ غير صالحة.")
  .refine((s) => Number(s) > 0, {
    message: "المبلغ يجب أن يكون أكبر من صفر.",
  });

export const studentPaymentRequestCreateBodySchema = z.object({
  courseId: z.string().cuid(),
  paidAmount: moneyStringSchema,
  paymentReference: z
    .string()
    .trim()
    .min(4, "أدخل رقم العملية أو المرجع.")
    .max(200),
  payerName: z.string().trim().max(120).optional(),
  payerPhone: z.string().trim().max(40).optional(),
  note: z.string().trim().max(1000).optional(),
});

export type StudentPaymentRequestCreateBody = z.infer<
  typeof studentPaymentRequestCreateBodySchema
>;

export const adminPaymentRequestRejectBodySchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(3, "اذكر سبب الرفض بوضوح.")
    .max(2000),
});

export type AdminPaymentRequestRejectBody = z.infer<
  typeof adminPaymentRequestRejectBodySchema
>;
