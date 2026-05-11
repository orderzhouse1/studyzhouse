import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { loadEnv } from "./config/env.js";
import { createRedisClient } from "./lib/redis.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { createApiRouter } from "./routes/index.js";

export function createApp(): Express {
  const env = loadEnv();

  const redis = createRedisClient(env.REDIS_URL);
  if (!redis && env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console -- bootstrap notice
    console.info("[studyhouse/api] Redis stub: no REDIS_URL — Phase 1 placeholder.");
  }

  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  /** CORS: أصل واحد صريح (CLIENT_ORIGIN) + credentials للكوكي — لا تستخدم wildcard مع credentials. */
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
