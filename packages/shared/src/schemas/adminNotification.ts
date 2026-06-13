import { z } from "zod";

export const adminNotificationTargetSchema = z.enum([
  "ALL_STUDENTS",
  "COURSE",
  "STUDENT",
]);

export type AdminNotificationTarget = z.infer<
  typeof adminNotificationTargetSchema
>;

export const adminSendNotificationBodySchema = z
  .object({
    target: adminNotificationTargetSchema,
    courseId: z.string().cuid().optional(),
    studentId: z.string().cuid().optional(),
    title: z.string().trim().min(1, "العنوان مطلوب.").max(200),
    body: z.string().trim().min(1, "النص مطلوب.").max(2000),
    actionUrl: z.string().trim().max(500).optional(),
    sendWebPush: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.target === "COURSE" && !data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "معرّف الكورس مطلوب عند الاستهداف حسب الكورس.",
        path: ["courseId"],
      });
    }
    if (data.target === "STUDENT" && !data.studentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "معرّف الطالب مطلوب عند استهداف طالب واحد.",
        path: ["studentId"],
      });
    }
  });

export type AdminSendNotificationBody = z.infer<
  typeof adminSendNotificationBodySchema
>;

export const adminSendNotificationResponseSchema = z.object({
  totalTargeted: z.number().int().min(0),
  notificationsCreated: z.number().int().min(0),
  webPushSent: z.number().int().min(0),
  webPushFailed: z.number().int().min(0),
  inactiveSubscriptionsDisabled: z.number().int().min(0),
});

export type AdminSendNotificationResponse = z.infer<
  typeof adminSendNotificationResponseSchema
>;
