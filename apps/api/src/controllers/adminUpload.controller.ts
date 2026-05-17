import type { Request, Response } from "express";

import type {
  CourseThumbnailUploadBody,
  LessonResourceUploadBody,
} from "@studyhouse/shared";

import { loadEnv } from "../config/env.js";
import { saveCourseThumbnailBase64 } from "../lib/courseThumbnailStorage.js";
import { saveLessonResourceBase64 } from "../lib/lessonResourceStorage.js";

function publicUploadUrl(relativePath: string): { url: string; path: string } {
  const env = loadEnv();
  const origin = env.CLIENT_ORIGIN.replace(/\/$/, "");
  return { url: `${origin}${relativePath}`, path: relativePath };
}

export async function uploadCourseThumbnailAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as CourseThumbnailUploadBody;
  const storedPath = await saveCourseThumbnailBase64(body.imageBase64);
  const { url, path } = publicUploadUrl(storedPath);

  res.status(201).json({
    success: true,
    data: { url, path },
  });
}

export async function uploadLessonResourceAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as LessonResourceUploadBody;
  const storedPath = await saveLessonResourceBase64(body.fileBase64);
  const { url, path } = publicUploadUrl(storedPath);

  res.status(201).json({
    success: true,
    data: {
      url,
      path,
      fileName: body.fileName?.trim() || null,
    },
  });
}
