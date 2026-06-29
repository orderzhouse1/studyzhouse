import { UserRole, UserStatus } from "@prisma/client";
import type { Request } from "express";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "./audit.service.js";

export async function deactivateStudentAccount(
  userId: string,
  req: Request,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, email: true },
  });

  if (!user || user.role !== UserRole.STUDENT) {
    throw new AppError("NOT_FOUND", "الحساب غير موجود.", 404);
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError("INVALID_STATE", "الحساب معطّل بالفعل.", 400);
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      "INVALID_STATE",
      "لا يمكن تعطيل هذا الحساب في حالته الحالية.",
      400,
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { status: UserStatus.DELETED },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "STUDENT_SELF_DEACTIVATED",
    entityType: "User",
    entityId: user.id,
    metadata: { previousStatus: user.status, newStatus: UserStatus.DELETED },
    req,
  });
}
