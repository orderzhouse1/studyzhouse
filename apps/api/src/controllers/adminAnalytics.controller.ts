import type { Request, Response } from "express";

import { adminAnalyticsDateRangeQuerySchema } from "@studyhouse/shared";

import {
  getAdminAnalyticsCourses,
  getAdminAnalyticsEngagement,
  getAdminAnalyticsOverview,
  getAdminAnalyticsStudents,
} from "../services/adminAnalytics.service.js";

export async function getAdminAnalyticsOverviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await getAdminAnalyticsOverview();
  res.status(200).json({ success: true, data });
}

export async function getAdminAnalyticsCoursesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await getAdminAnalyticsCourses();
  res.status(200).json({ success: true, data });
}

export async function getAdminAnalyticsStudentsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await getAdminAnalyticsStudents();
  res.status(200).json({ success: true, data });
}

export async function getAdminAnalyticsEngagementHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const query = adminAnalyticsDateRangeQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );
  const data = await getAdminAnalyticsEngagement(query.days);
  res.status(200).json({ success: true, data });
}
