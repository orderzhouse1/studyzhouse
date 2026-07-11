import type { NextFunction, Request, Response } from "express";

import { UserStatus } from "@prisma/client";

import { extractAccessTokenFromRequest } from "../lib/authToken.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

/** Attaches req.auth when a valid token is present; never rejects. */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractAccessTokenFromRequest(req);
    if (!token) {
      next();
      return;
    }

    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      req.auth = { userId: user.id, role: user.role };
    }
  } catch {
    /* ignore invalid tokens on public routes */
  }
  next();
}
