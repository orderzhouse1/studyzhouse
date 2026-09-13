import { Router } from "express";
import { UserRole } from "@prisma/client";

import {
  appleIapNotificationBodySchema,
  appleIapRestoreBodySchema,
  appleIapVerifyBodySchema,
} from "@studyhouse/shared";

import * as studentAppleIapController from "../controllers/studentAppleIap.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validateBody } from "../validators/validate.js";

const STUDENT_ONLY = [UserRole.STUDENT] as const;

/**
 * Mobile Apple IAP routes:
 * - Authenticated: verify / restore
 * - Public: App Store Server Notifications V2
 */
export const mobileAppleIapRouter = Router();

mobileAppleIapRouter.post(
  "/course/verify",
  requireAuth,
  requireRole(STUDENT_ONLY),
  validateBody(appleIapVerifyBodySchema),
  asyncHandler(studentAppleIapController.verifyAppleIapPurchase),
);

mobileAppleIapRouter.post(
  "/restore",
  requireAuth,
  requireRole(STUDENT_ONLY),
  validateBody(appleIapRestoreBodySchema),
  asyncHandler(studentAppleIapController.restoreAppleIapPurchases),
);

mobileAppleIapRouter.post(
  "/notifications",
  validateBody(appleIapNotificationBodySchema),
  asyncHandler(studentAppleIapController.receiveAppleIapNotification),
);
