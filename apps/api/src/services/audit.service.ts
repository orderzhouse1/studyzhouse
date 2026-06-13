import type { Request } from "express";
import type { AuditLogSeverity, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

function clientIp(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0]?.trim();
  }
  return req.ip;
}

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  severity?: AuditLogSeverity;
  metadata?: Record<string, unknown>;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  req?: Request;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      severity: input.severity ?? "INFO",
      metadataJson: (input.metadata ?? {}) as Prisma.InputJsonValue,
      beforeJson: (input.beforeJson ?? undefined) as Prisma.InputJsonValue | undefined,
      afterJson: (input.afterJson ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: input.req ? clientIp(input.req) : undefined,
      userAgent: input.req?.headers["user-agent"] ?? undefined,
    },
  });
}
