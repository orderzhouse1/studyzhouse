import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  isSignupRateLimitSkipped,
  SIGNUP_RATE_LIMIT,
} from "./signupRateLimiter.js";

describe("signupRateLimiter configuration", () => {
  it("keeps production limits at 10 requests per 15 minutes", () => {
    expect(SIGNUP_RATE_LIMIT.limit).toBe(10);
    expect(SIGNUP_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
  });

  it("is skipped when NODE_ENV is test (integration suite)", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(isSignupRateLimitSkipped()).toBe(true);
  });
});

describe("signup rate limit behavior (isolated)", () => {
  function appWithLimit(limit: number): Express {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60_000,
      limit,
      standardHeaders: false,
      legacyHeaders: false,
      skip: () => false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: { code: "RATE_LIMITED", message: "rate limited" },
        });
      },
    });
    app.post("/probe", limiter, (_req, res) => {
      res.status(200).json({ success: true });
    });
    return app;
  }

  it("returns RATE_LIMITED after the configured limit", async () => {
    const app = appWithLimit(2);
    await request(app).post("/probe").expect(200);
    await request(app).post("/probe").expect(200);
    const blocked = await request(app).post("/probe");
    expect(blocked.status).toBe(429);
    expect(blocked.body?.error?.code).toBe("RATE_LIMITED");
  });
});
