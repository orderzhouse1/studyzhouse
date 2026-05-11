import { Router } from "express";

import * as superAdminController from "../controllers/superAdmin.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  emptyBodySchema,
  superAdminAdminCreateBodySchema,
  superAdminAdminIdParamsSchema,
  superAdminAdminPatchBodySchema,
  superAdminAdminsQuerySchema,
  superAdminAuditLogsQuerySchema,
  superAdminSettingsPatchBodySchema,
} from "@studyhouse/shared";

export const superAdminRouter = Router();

superAdminRouter.get(
  "/overview",
  asyncHandler(superAdminController.getSuperAdminOverview),
);

superAdminRouter.get(
  "/admins",
  validateQuery(superAdminAdminsQuerySchema),
  asyncHandler(superAdminController.listSuperAdminAdmins),
);

superAdminRouter.post(
  "/admins",
  validateBody(superAdminAdminCreateBodySchema),
  asyncHandler(superAdminController.createSuperAdminAdmin),
);

superAdminRouter.post(
  "/admins/:adminId/disable",
  validateParams(superAdminAdminIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(superAdminController.disableSuperAdminAdmin),
);

superAdminRouter.post(
  "/admins/:adminId/enable",
  validateParams(superAdminAdminIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(superAdminController.enableSuperAdminAdmin),
);

superAdminRouter.get(
  "/admins/:adminId",
  validateParams(superAdminAdminIdParamsSchema),
  asyncHandler(superAdminController.getSuperAdminAdmin),
);

superAdminRouter.patch(
  "/admins/:adminId",
  validateParams(superAdminAdminIdParamsSchema),
  validateBody(superAdminAdminPatchBodySchema),
  asyncHandler(superAdminController.patchSuperAdminAdmin),
);

superAdminRouter.get(
  "/audit-logs",
  validateQuery(superAdminAuditLogsQuerySchema),
  asyncHandler(superAdminController.listSuperAdminAuditLogs),
);

superAdminRouter.get(
  "/settings",
  asyncHandler(superAdminController.getSuperAdminSettings),
);

superAdminRouter.patch(
  "/settings",
  validateBody(superAdminSettingsPatchBodySchema),
  asyncHandler(superAdminController.patchSuperAdminSettings),
);
