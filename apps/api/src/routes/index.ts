import { Router } from "express";
import { UserRole } from "@prisma/client";

import { API_VERSION, apiBasePath } from "@studyhouse/shared";

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { authRouter } from "./auth.routes.js";
import { categoriesAdminRouter } from "./categoriesAdmin.routes.js";
import { categoriesPublicRouter } from "./categoriesPublic.routes.js";
import { adminActivationCodesRouter } from "./adminActivationCodes.routes.js";
import { adminPaymentRequestsRouter } from "./adminPaymentRequests.routes.js";
import { adminStudentsRouter } from "./adminStudents.routes.js";
import { coursesAdminRouter } from "./coursesAdmin.routes.js";
import { coursesPublicRouter } from "./coursesPublic.routes.js";
import { healthRouter } from "./health.routes.js";
import { studentRouter } from "./student.routes.js";
import { superAdminRouter } from "./superAdmin.routes.js";

const ADMIN_ACCESS_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;
const STUDENT_ONLY = [UserRole.STUDENT] as const;
const SUPER_ADMIN_ONLY = [UserRole.SUPER_ADMIN] as const;

export function createApiRouter(): Router {
  const router = Router();
  const base = apiBasePath(API_VERSION);

  router.use(`${base}/health`, healthRouter);
  router.use(`${base}/auth`, authRouter);

  router.use(`${base}/categories`, categoriesPublicRouter);
  router.use(
    `${base}/admin/categories`,
    requireAuth,
    requireRole(ADMIN_ACCESS_ROLES),
    categoriesAdminRouter,
  );

  router.use(`${base}/courses`, coursesPublicRouter);
  router.use(
    `${base}/admin/students`,
    requireAuth,
    requireRole(ADMIN_ACCESS_ROLES),
    adminStudentsRouter,
  );

  router.use(
    `${base}/admin/activation-codes`,
    requireAuth,
    requireRole(ADMIN_ACCESS_ROLES),
    adminActivationCodesRouter,
  );

  router.use(
    `${base}/admin/payment-requests`,
    requireAuth,
    requireRole(ADMIN_ACCESS_ROLES),
    adminPaymentRequestsRouter,
  );

  router.use(
    `${base}/admin/courses`,
    requireAuth,
    requireRole(ADMIN_ACCESS_ROLES),
    coursesAdminRouter,
  );

  router.use(
    `${base}/student`,
    requireAuth,
    requireRole(STUDENT_ONLY),
    studentRouter,
  );

  router.use(
    `${base}/super-admin`,
    requireAuth,
    requireRole(SUPER_ADMIN_ONLY),
    superAdminRouter,
  );

  return router;
}
