import type { Course } from "@prisma/client";
import type { Request } from "express";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "./audit.service.js";
import {
  computePublishReadiness,
  publishReadinessMissingMessages,
} from "./courseReadiness.service.js";

/**
 * يفرض قواعد النشر نفسها الواجهة — مع تسجيل تدقيق عند الرفض.
 * يُستدعى من POST .../publish ومن تحديث الكورس عند الانتقال إلى منشور.
 */
export async function enforcePublishReadinessForAdminCourse(input: {
  course: Course;
  actorId: string;
  req: Request;
}): Promise<void> {
  const sections = await prisma.courseSection.findMany({
    where: { courseId: input.course.id },
    include: { lessons: true },
    orderBy: { sortOrder: "asc" },
  });

  const readinessFlags = computePublishReadiness(input.course, sections);
  const missing = publishReadinessMissingMessages(input.course, readinessFlags);

  if (!readinessFlags.canPublish) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "COURSE_PUBLISH_BLOCKED",
      entityType: "Course",
      entityId: input.course.id,
      metadata: { missing },
      req: input.req,
    });
    throw new AppError(
      "PUBLISH_READINESS",
      "لا يمكن نشر الكورس قبل اكتمال المحتوى",
      400,
      { missing },
    );
  }
}
