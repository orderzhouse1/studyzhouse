import type { Prisma } from "@prisma/client";
import type { AuditLogSeverity } from "@prisma/client";

import type { AuditLogDetail, AuditLogListItem, AuditLogsQuery } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";

const SENSITIVE_META_KEYS = new Set([
  "password",
  "passwordhash",
  "hash",
  "plaincode",
  "token",
  "secret",
  "pepper",
  "refreshtoken",
]);

export function sanitizeAuditMetadata(meta: unknown): unknown {
  if (meta === null || typeof meta !== "object") {
    return meta;
  }
  if (Array.isArray(meta)) {
    return meta.map((x) => sanitizeAuditMetadata(x));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    const lk = k.toLowerCase();
    if (
      SENSITIVE_META_KEYS.has(lk) ||
      lk.includes("password") ||
      lk.includes("secret") ||
      lk.includes("hash")
    ) {
      out[k] = "[مخفي]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = sanitizeAuditMetadata(v) as unknown;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function buildAuditWhere(query: AuditLogsQuery): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.actorId) {
    where.actorId = query.actorId;
  }
  if (query.action?.trim()) {
    where.action = {
      contains: query.action.trim(),
      mode: "insensitive",
    };
  }
  if (query.entityType?.trim()) {
    where.entityType = {
      equals: query.entityType.trim(),
      mode: "insensitive",
    };
  }
  if (query.severity) {
    where.severity = query.severity;
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) {
      where.createdAt.gte = query.from;
    }
    if (query.to) {
      where.createdAt.lte = query.to;
    }
  }

  return where;
}

function mapListRow(row: {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  severity: AuditLogSeverity;
  metadataJson: unknown;
  createdAt: Date;
  actor: null | { id: string; fullName: string; email: string };
}): AuditLogListItem {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    severity: row.severity,
    metadata: sanitizeAuditMetadata(row.metadataJson),
    createdAt: row.createdAt.toISOString(),
    actor: row.actor
      ? {
          id: row.actor.id,
          fullName: row.actor.fullName,
          email: row.actor.email,
        }
      : null,
  };
}

export async function listAuditLogs(query: AuditLogsQuery): Promise<{
  items: AuditLogListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { skip, take } = prismaSkipTake(query.page, query.pageSize);
  const where = buildAuditWhere(query);

  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map(mapListRow),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getAuditLogById(
  auditLogId: string,
): Promise<AuditLogDetail | null> {
  const row = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
    include: {
      actor: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!row) return null;

  return {
    ...mapListRow(row),
    beforeJson: sanitizeAuditMetadata(row.beforeJson),
    afterJson: sanitizeAuditMetadata(row.afterJson),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}

export async function requireAuditLogById(
  auditLogId: string,
): Promise<AuditLogDetail> {
  const row = await getAuditLogById(auditLogId);
  if (!row) {
    throw new AppError("NOT_FOUND", "سجل العملية غير موجود.", 404);
  }
  return row;
}
