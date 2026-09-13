import { z } from "zod";

export const appleIapVerifyBodySchema = z.object({
  courseId: z.string().cuid().optional(),
  productId: z.string().trim().min(1, "معرّف منتج Apple مطلوب."),
  transactionId: z.string().trim().min(1, "معرّف المعاملة مطلوب."),
  purchaseDate: z.string().datetime().optional(),
  verificationData: z
    .string()
    .trim()
    .min(1, "بيانات التحقق من Apple مطلوبة."),
  environment: z.enum(["Sandbox", "Production"]).optional(),
});

export const appleIapRestoreBodySchema = z.object({
  purchases: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        transactionId: z.string().trim().min(1),
        purchaseDate: z.string().datetime().optional(),
        verificationData: z.string().trim().min(1),
        environment: z.enum(["Sandbox", "Production"]).optional(),
      }),
    )
    .min(1),
});

export const appleIapNotificationBodySchema = z.object({
  signedPayload: z.string().trim().min(1, "signedPayload مطلوب."),
});

export type AppleIapVerifyBody = z.infer<typeof appleIapVerifyBodySchema>;
export type AppleIapRestoreBody = z.infer<typeof appleIapRestoreBodySchema>;
export type AppleIapNotificationBody = z.infer<
  typeof appleIapNotificationBodySchema
>;
