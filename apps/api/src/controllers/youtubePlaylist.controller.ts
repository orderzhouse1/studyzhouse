import type { Request, Response } from "express";
import { LessonStatus } from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { assertCanManageCourse } from "../lib/courseAccess.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import { getStructureCoursePayload } from "../services/courseStructurePayload.service.js";
import {
  fetchPlaylistVideosNormalized,
  requireYoutubeDataApiKey,
} from "../services/youtubePlaylist.service.js";
import type {
  YoutubePlaylistImportBody,
  YoutubePlaylistPreviewBody,
} from "@studyhouse/shared";
import {
  normalizeYoutubeWatchUrl,
  parseYoutubePlaylistId,
} from "@studyhouse/shared";

import type { Course } from "@prisma/client";

type CourseWithCategory = Course & {
  category: { id: string; name: string; slug: string } | null;
};

async function loadCourseForManage(courseId: string): Promise<CourseWithCategory> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { category: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  return course;
}

export async function previewYoutubePlaylistAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ??
      req.params.courseId,
  );
  const body = req.body as YoutubePlaylistPreviewBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const apiKey = requireYoutubeDataApiKey();
  const playlistId = parseYoutubePlaylistId(body.playlistUrl);
  if (!playlistId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "تعذّر استخراج معرف قائمة التشغيل من الرابط. تأكد من وجود list= في الرابط.",
      400,
    );
  }

  const { playlistTitle, videos } = await fetchPlaylistVideosNormalized(
    apiKey,
    playlistId,
  );

  await writeAuditLog({
    actorId: req.auth?.userId,
    action: "YOUTUBE_PLAYLIST_PREVIEW",
    entityType: "Course",
    entityId: courseId,
    metadata: { playlistId, videoCount: videos.length },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      playlistId,
      title: playlistTitle,
      videos: videos.map((v) => ({
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        position: v.position,
      })),
    },
  });
}

export async function importYoutubePlaylistAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const courseId = String(
    (req.validatedParams as { courseId: string }).courseId ??
      req.params.courseId,
  );
  const body = req.body as YoutubePlaylistImportBody;

  const course = await loadCourseForManage(courseId);
  assertCanManageCourse(req, course);

  const apiKey = requireYoutubeDataApiKey();
  const playlistId = parseYoutubePlaylistId(body.playlistUrl);
  if (!playlistId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "تعذّر استخراج معرف قائمة التشغيل من الرابط.",
      400,
    );
  }

  const existingIds = new Set(
    (
      await prisma.lesson.findMany({
        where: { courseId },
        select: { youtubeVideoId: true },
      })
    )
      .map((l) => l.youtubeVideoId)
      .filter((id): id is string => Boolean(id)),
  );

  try {
    const { videos } = await fetchPlaylistVideosNormalized(apiKey, playlistId);

    if (videos.length === 0) {
      throw new AppError(
        "PLAYLIST_EMPTY",
        "القائمة فارغة أو لا تحتوي على فيديوهات يمكن استيرادها.",
        400,
      );
    }

    let sectionId: string;
    let nextOrder: number;

    if (body.mode === "CREATE_NEW_SECTION") {
      const title = body.sectionTitle!.trim();
      const agg = await prisma.courseSection.aggregate({
        where: { courseId },
        _max: { sortOrder: true },
      });
      const sortOrder =
        agg._max.sortOrder === null ? 0 : agg._max.sortOrder + 1;
      const sec = await prisma.courseSection.create({
        data: {
          courseId,
          title,
          description: null,
          sortOrder,
        },
      });
      sectionId = sec.id;
      nextOrder = 0;
    } else {
      const sid = body.sectionId!;
      const sec = await prisma.courseSection.findFirst({
        where: { id: sid, courseId },
      });
      if (!sec) {
        throw new AppError("NOT_FOUND", "القسم غير موجود.", 404);
      }
      sectionId = sid;
      const agg = await prisma.lesson.aggregate({
        where: { courseId, sectionId },
        _max: { sortOrder: true },
      });
      nextOrder =
        agg._max.sortOrder === null ? 0 : agg._max.sortOrder + 1;
    }

    let order = nextOrder;
    let imported = 0;
    let skippedDuplicates = 0;

    for (const v of videos) {
      if (existingIds.has(v.youtubeVideoId)) {
        skippedDuplicates++;
        continue;
      }

      await prisma.lesson.create({
        data: {
          courseId,
          sectionId,
          title: v.title.slice(0, 500),
          description: v.description ? v.description.slice(0, 8000) : null,
          youtubeVideoId: v.youtubeVideoId,
          youtubeUrl: normalizeYoutubeWatchUrl(v.youtubeVideoId),
          durationSeconds: null,
          isPreview: false,
          sortOrder: order,
          status: LessonStatus.DRAFT,
        },
      });
      existingIds.add(v.youtubeVideoId);
      order++;
      imported++;
    }

    await writeAuditLog({
      actorId: req.auth?.userId,
      action: "YOUTUBE_PLAYLIST_IMPORT",
      entityType: "Course",
      entityId: courseId,
      metadata: {
        playlistId,
        imported,
        skippedDuplicates,
        sectionId,
        mode: body.mode,
      },
      req,
    });

    const structure = await getStructureCoursePayload(courseId);
    res.status(200).json({
      success: true,
      data: {
        ...structure,
        importSummary: { imported, skippedDuplicates },
      },
    });
  } catch (e) {
    if (e instanceof AppError) {
      await writeAuditLog({
        actorId: req.auth?.userId,
        action: "YOUTUBE_PLAYLIST_IMPORT_FAILED",
        entityType: "Course",
        entityId: courseId,
        metadata: {
          playlistId,
          code: e.code,
          message: e.message,
        },
        req,
      });
      throw e;
    }
    await writeAuditLog({
      actorId: req.auth?.userId,
      action: "YOUTUBE_PLAYLIST_IMPORT_FAILED",
      entityType: "Course",
      entityId: courseId,
      metadata: { playlistId, error: String(e) },
      req,
    });
    throw new AppError(
      "INTERNAL_IMPORT_ERROR",
      "تعذّر إكمال الاستيراد بسبب خطأ غير متوقع.",
      500,
    );
  }
}
