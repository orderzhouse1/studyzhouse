import { z } from "zod";

export const userRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "STUDENT"]);

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح."),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
    .max(128, "كلمة المرور طويلة جدًا."),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const authUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authMeResponseSchema = z.object({
  user: authUserSchema,
});
