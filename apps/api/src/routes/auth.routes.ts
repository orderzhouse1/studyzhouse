import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import * as googleAuthController from "../controllers/googleAuth.controller.js";
import * as passwordResetOtpController from "../controllers/passwordResetOtp.controller.js";
import * as signupOtpController from "../controllers/signupOtp.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { forgotPasswordRateLimiter } from "../middlewares/forgotPasswordRateLimiter.js";
import { loginRateLimiter } from "../middlewares/loginRateLimiter.js";
import { signupRateLimiter } from "../middlewares/signupRateLimiter.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validateBody } from "../validators/validate.js";
import {
  forgotPasswordRequestOtpBodySchema,
  forgotPasswordResendOtpBodySchema,
  forgotPasswordVerifyOtpBodySchema,
  loginBodySchema,
  signupBodySchema,
  signupOtpResendBodySchema,
  signupOtpVerifyBodySchema,
} from "@studyhouse/shared";

export const authRouter = Router();

authRouter.get(
  "/google",
  asyncHandler(googleAuthController.startGoogleAuth),
);

authRouter.get(
  "/google/callback",
  asyncHandler(googleAuthController.googleAuthCallback),
);

authRouter.post(
  "/signup/request-otp",
  signupRateLimiter,
  validateBody(signupBodySchema),
  asyncHandler(signupOtpController.requestSignupOtp),
);

authRouter.post(
  "/signup/verify-otp",
  signupRateLimiter,
  validateBody(signupOtpVerifyBodySchema),
  asyncHandler(signupOtpController.verifySignupOtp),
);

authRouter.post(
  "/signup/resend-otp",
  signupRateLimiter,
  validateBody(signupOtpResendBodySchema),
  asyncHandler(signupOtpController.resendSignupOtp),
);

/** @deprecated — returns 410 SIGNUP_REQUIRES_OTP; use request-otp + verify-otp */
authRouter.post(
  "/signup",
  signupRateLimiter,
  validateBody(signupBodySchema),
  asyncHandler(authController.signup),
);

authRouter.post(
  "/forgot-password/request-otp",
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordRequestOtpBodySchema),
  asyncHandler(passwordResetOtpController.requestPasswordResetOtp),
);

authRouter.post(
  "/forgot-password/resend-otp",
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordResendOtpBodySchema),
  asyncHandler(passwordResetOtpController.resendPasswordResetOtp),
);

authRouter.post(
  "/forgot-password/verify-otp",
  forgotPasswordRateLimiter,
  validateBody(forgotPasswordVerifyOtpBodySchema),
  asyncHandler(passwordResetOtpController.verifyPasswordResetOtp),
);

authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginBodySchema),
  asyncHandler(authController.login),
);

authRouter.post("/logout", asyncHandler(authController.logout));

authRouter.get("/me", requireAuth, asyncHandler(authController.me));
