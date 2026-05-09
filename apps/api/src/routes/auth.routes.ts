import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { loginRateLimiter } from "../middlewares/loginRateLimiter.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validateBody } from "../validators/validate.js";
import { loginBodySchema } from "@studyhouse/shared";

export const authRouter = Router();

authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginBodySchema),
  authController.login,
);

authRouter.post("/logout", authController.logout);

authRouter.get("/me", requireAuth, authController.me);
