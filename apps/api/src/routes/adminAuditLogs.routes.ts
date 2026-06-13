import { Router } from "express";

import * as adminAuditLogController from "../controllers/adminAuditLog.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateQuery } from "../validators/validate.js";
import {
  auditLogIdParamsSchema,
  auditLogsQuerySchema,
} from "@studyhouse/shared";

export const adminAuditLogsRouter = Router();

adminAuditLogsRouter.get(
  "/",
  validateQuery(auditLogsQuerySchema),
  asyncHandler(adminAuditLogController.listAdminAuditLogs),
);

adminAuditLogsRouter.get(
  "/:auditLogId",
  validateParams(auditLogIdParamsSchema),
  asyncHandler(adminAuditLogController.getAdminAuditLog),
);
