import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);

export const adminStudentsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: userStatusSchema.optional(),
});

export type AdminStudentsQuery = z.infer<typeof adminStudentsQuerySchema>;

export const adminStudentIdParamsSchema = z.object({
  studentId: z.string().cuid(),
});

export const adminStudentEnrollmentParamsSchema = z.object({
  studentId: z.string().cuid(),
  enrollmentId: z.string().cuid(),
});

export const adminStudentCreateBodySchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جدًا."),
  email: z.string().trim().email("البريد غير صالح."),
  password: z.preprocess(
    (v) =>
      v === "" || v === undefined || v === null ? undefined : v,
    z.string().trim().min(8, "كلمة المرور يجب أن لا تقل عن 8 أحرف.").optional(),
  ),
  status: userStatusSchema.optional().default("ACTIVE"),
});

export type AdminStudentCreateBody = z.infer<typeof adminStudentCreateBodySchema>;

export const adminStudentUpdateBodySchema = z
  .object({
    fullName: z.string().trim().min(2).optional(),
    status: userStatusSchema.optional(),
    password: z.preprocess(
      (v) =>
        v === "" || v === undefined || v === null ? undefined : v,
      z.string().trim().min(8, "كلمة المرور يجب أن لا تقل عن 8 أحرف.").optional(),
    ),
  })
  .refine((d) => d.fullName !== undefined || d.status !== undefined || d.password !== undefined, {
    message: "لا يوجد شيء للتحديث.",
  });

export type AdminStudentUpdateBody = z.infer<typeof adminStudentUpdateBodySchema>;

export const adminEnrollmentCreateBodySchema = z.object({
  courseId: z.string().cuid(),
});

export type AdminEnrollmentCreateBody = z.infer<
  typeof adminEnrollmentCreateBodySchema
>;
