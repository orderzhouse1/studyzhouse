import type { Request, Response } from "express";

import { healthResponseSchema } from "@studyhouse/shared";

export function getHealth(_req: Request, res: Response): void {
  const body = healthResponseSchema.parse({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
  res.status(200).json({ success: true, data: body });
}
