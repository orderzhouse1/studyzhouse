import { Router } from "express";

import * as categoryController from "../controllers/category.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminCategoriesQuerySchema,
  categoryCreateBodySchema,
  categoryIdParamsSchema,
  categoryUpdateBodySchema,
} from "@studyhouse/shared";

export const categoriesAdminRouter = Router();

categoriesAdminRouter.get(
  "/",
  validateQuery(adminCategoriesQuerySchema),
  asyncHandler(categoryController.listCategoriesAdmin),
);

categoriesAdminRouter.post(
  "/",
  validateBody(categoryCreateBodySchema),
  asyncHandler(categoryController.createCategoryAdmin),
);

categoriesAdminRouter.patch(
  "/:id",
  validateParams(categoryIdParamsSchema),
  validateBody(categoryUpdateBodySchema),
  asyncHandler(categoryController.updateCategoryAdmin),
);

categoriesAdminRouter.delete(
  "/:id",
  validateParams(categoryIdParamsSchema),
  asyncHandler(categoryController.archiveCategoryAdmin),
);
