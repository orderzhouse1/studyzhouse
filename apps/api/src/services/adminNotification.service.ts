import { EnrollmentStatus, NotificationType, UserRole, UserStatus } from "@prisma/client";
import type { Request } from "express";

import type { AdminSendNotificationBody } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "./audit.service.js";
import { createNotification } from "./notification.service.js";
import { sendWebPushToUsers } from "./webPushDelivery.service.js";

async function resolveTargetStudentIds(
  body: AdminSendNotificationBody,
): Promise<string[]> {
  if (body.target === "ALL_STUDENTS") {
    const rows = await prisma.user.findMany({
      where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  if (body.target === "STUDENT") {
    const student = await prisma.user.findFirst({
      where: {
        id: body.studentId,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!student) {
      throw new AppError("NOT_FOUND", "الطالب غير موجود.", 404);
    }
    return [student.id];
  }

  const course = await prisma.course.findUnique({
    where: { id: body.courseId },
    select: { id: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, status: EnrollmentStatus.ACTIVE },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  return enrollments.map((e) => e.studentId);
}

export async function sendAdminNotification(
  adminId: string,
  body: AdminSendNotificationBody,
  req: Request,
): Promise<{
  totalTargeted: number;
  notificationsCreated: number;
  webPushSent: number;
  webPushFailed: number;
  inactiveSubscriptionsDisabled: number;
}> {
  const userIds = await resolveTargetStudentIds(body);
  const totalTargeted = userIds.length;

  let notificationsCreated = 0;
  for (const userId of userIds) {
    await createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: body.title,
      body: body.body,
      actionUrl: body.actionUrl ?? null,
      skipWebPush: true,
    });
    notificationsCreated += 1;
  }

  let webPushSent = 0;
  let webPushFailed = 0;
  let inactiveSubscriptionsDisabled = 0;

  if (body.sendWebPush) {
    const stats = await sendWebPushToUsers(userIds, {
      title: body.title,
      body: body.body,
      url: body.actionUrl ?? "/student/notifications",
    });
    webPushSent = stats.webPushSent;
    webPushFailed = stats.webPushFailed;
    inactiveSubscriptionsDisabled = stats.inactiveSubscriptionsDisabled;
  }

  await writeAuditLog({
    actorId: adminId,
    action: "ADMIN_NOTIFICATION_SEND",
    entityType: "Notification",
    metadata: {
      target: body.target,
      totalTargeted,
      notificationsCreated,
      webPushSent,
      webPushFailed,
      sendWebPush: body.sendWebPush,
    },
    req,
  });

  return {
    totalTargeted,
    notificationsCreated,
    webPushSent,
    webPushFailed,
    inactiveSubscriptionsDisabled,
  };
}
