import type { Request, Response } from "express";

import {
  auditLogIdParamsSchema,
  auditLogsQuerySchema,
} from "@studyhouse/shared";

import {
  getAuditLogById,
  listAuditLogs,
} from "../services/auditLog.service.js";

export async function listAdminAuditLogs(
  req: Request,
  res: Response,
): Promise<void> {
  const query = auditLogsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );
  const result = await listAuditLogs(query);

  res.status(200).json({
    success: true,
    data: { items: result.items },
    meta: result.meta,
  });
}

export async function getAdminAuditLog(
  req: Request,
  res: Response,
): Promise<void> {
  const { auditLogId } = auditLogIdParamsSchema.parse(req.params);
  const row = await getAuditLogById(auditLogId);

  if (!row) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "سجل العملية غير موجود." },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: row,
  });
}
