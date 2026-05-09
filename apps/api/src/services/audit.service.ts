import type { Request } from "express";
import type { Prisma } from "@prisma/client";

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
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadataJson: (input.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: input.req ? clientIp(input.req) : undefined,
      userAgent: input.req?.headers["user-agent"] ?? undefined,
    },
  });
}
