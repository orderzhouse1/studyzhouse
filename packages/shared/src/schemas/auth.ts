import { z } from "zod";

export const userRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "STUDENT"]);

export const userStatusSchema = z.enum([
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "DELETED",
]);

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح."),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
    .max(128, "كلمة المرور طويلة جدًا."),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
  .max(128, "كلمة المرور طويلة جدًا.")
  .refine((v) => /[a-zA-Z\u0600-\u06FF]/.test(v), {
    message: "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل.",
  })
  .refine((v) => /\d/.test(v), {
    message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.",
  });

export const signupBodySchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم قصير جدًا.")
      .max(120, "الاسم طويل جدًا."),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح."),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "يجب الموافقة على الشروط.",
      }),
    }),
  })
  .strict()
  .refine((d) => d.password === d.confirmPassword, {
    message: "تأكيد كلمة المرور غير متطابق.",
    path: ["confirmPassword"],
  });

export type SignupBody = z.infer<typeof signupBodySchema>;

export const signupOtpVerifyBodySchema = z
  .object({
    challengeId: z.string().cuid("معرّف التحقق غير صالح."),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون 6 أرقام."),
  })
  .strict();

export type SignupOtpVerifyBody = z.infer<typeof signupOtpVerifyBodySchema>;

export const signupOtpResendBodySchema = z
  .object({
    challengeId: z.string().cuid("معرّف التحقق غير صالح."),
  })
  .strict();

export type SignupOtpResendBody = z.infer<typeof signupOtpResendBodySchema>;

export const signupPublicUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.literal("STUDENT"),
  status: z.literal("ACTIVE"),
});

export const authUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().nullable(),
  status: userStatusSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authMeResponseSchema = z.object({
  user: authUserSchema,
});

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "إذا كان البريد مسجلًا لدينا، ستصلك رسالة تحتوي على رمز إعادة التعيين.";

export const forgotPasswordRequestOtpBodySchema = z
  .object({
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح."),
  })
  .strict();

export type ForgotPasswordRequestOtpBody = z.infer<
  typeof forgotPasswordRequestOtpBodySchema
>;

export const forgotPasswordResendOtpBodySchema = z
  .object({
    challengeId: z.string().cuid("معرّف التحقق غير صالح."),
    email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صالح."),
  })
  .strict();

export type ForgotPasswordResendOtpBody = z.infer<
  typeof forgotPasswordResendOtpBodySchema
>;

export const forgotPasswordVerifyOtpBodySchema = z
  .object({
    challengeId: z.string().cuid("معرّف التحقق غير صالح."),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون 6 أرقام."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "تأكيد كلمة المرور غير متطابق.",
    path: ["confirmPassword"],
  });

export type ForgotPasswordVerifyOtpBody = z.infer<
  typeof forgotPasswordVerifyOtpBodySchema
>;
