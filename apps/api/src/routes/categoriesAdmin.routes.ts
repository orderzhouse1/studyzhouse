import { Router } from "express";

import * as categoryController from "../controllers/category.controller.js";
import {
  validateBody,
  validateParams,
} from "../validators/validate.js";
import {
  categoryCreateBodySchema,
  categoryIdParamsSchema,
  categoryUpdateBodySchema,
} from "@studyhouse/shared";

export const categoriesAdminRouter = Router();

categoriesAdminRouter.post(
  "/",
  validateBody(categoryCreateBodySchema),
  categoryController.createCategoryAdmin,
);

categoriesAdminRouter.patch(
  "/:id",
  validateParams(categoryIdParamsSchema),
  validateBody(categoryUpdateBodySchema),
  categoryController.updateCategoryAdmin,
);

categoriesAdminRouter.delete(
  "/:id",
  validateParams(categoryIdParamsSchema),
  categoryController.archiveCategoryAdmin,
);
