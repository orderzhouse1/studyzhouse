import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const auditLogSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);

export type AuditLogSeverity = z.infer<typeof auditLogSeveritySchema>;

export const auditLogsQuerySchema = paginationQuerySchema.extend({
  actorId: z.string().cuid().optional(),
  action: z.string().trim().min(1).max(120).optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  severity: auditLogSeveritySchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;

export const auditLogIdParamsSchema = z.object({
  auditLogId: z.string().cuid(),
});

export const auditLogListItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  severity: auditLogSeveritySchema,
  metadata: z.unknown(),
  createdAt: z.string().datetime(),
  actor: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string(),
    })
    .nullable(),
});

export type AuditLogListItem = z.infer<typeof auditLogListItemSchema>;

export const auditLogDetailSchema = auditLogListItemSchema.extend({
  beforeJson: z.unknown().nullable(),
  afterJson: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export type AuditLogDetail = z.infer<typeof auditLogDetailSchema>;
