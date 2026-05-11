import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const superAdminAuditLogsQuerySchema = paginationQuerySchema.extend({
  actorId: z.string().cuid().optional(),
  action: z.string().trim().min(1).max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type SuperAdminAuditLogsQuery = z.infer<
  typeof superAdminAuditLogsQuerySchema
>;

export const superAdminAdminsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
});

export type SuperAdminAdminsQuery = z.infer<
  typeof superAdminAdminsQuerySchema
>;

export const superAdminAdminIdParamsSchema = z.object({
  adminId: z.string().cuid(),
});

export const superAdminAdminCreateBodySchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جدًا.").max(120),
  email: z.string().trim().email("بريد غير صالح."),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل.").max(128).optional(),
});

export type SuperAdminAdminCreateBody = z.infer<
  typeof superAdminAdminCreateBodySchema
>;

export const superAdminAdminPatchBodySchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine(
    (d) =>
      d.fullName !== undefined ||
      d.status !== undefined ||
      d.newPassword !== undefined,
    { message: "لا يوجد شيء للتحديث." },
  );

export type SuperAdminAdminPatchBody = z.infer<
  typeof superAdminAdminPatchBodySchema
>;

export const superAdminSettingsPatchBodySchema = z
  .object({
    platformName: z.string().trim().min(1).max(120).optional(),
    supportEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),
    cliqAlias: z.string().trim().max(200).optional(),
    cliqInstructions: z.string().trim().max(4000).optional(),
    allowStudentSignup: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
  })
  .refine(
    (o) =>
      o.platformName !== undefined ||
      o.supportEmail !== undefined ||
      o.cliqAlias !== undefined ||
      o.cliqInstructions !== undefined ||
      o.allowStudentSignup !== undefined ||
      o.maintenanceMode !== undefined,
    { message: "لا يوجد شيء للتحديث." },
  );

export type SuperAdminSettingsPatchBody = z.infer<
  typeof superAdminSettingsPatchBodySchema
>;
