import { Router } from "express";

import * as categoryController from "../controllers/category.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateQuery } from "../validators/validate.js";
import { publicCategoriesQuerySchema } from "@studyhouse/shared";

export const categoriesPublicRouter = Router();

categoriesPublicRouter.get(
  "/",
  validateQuery(publicCategoriesQuerySchema),
  asyncHandler(categoryController.listCategoriesPublic),
);
