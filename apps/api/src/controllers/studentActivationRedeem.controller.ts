import type { Request, Response } from "express";
import {
  ActivationCodeStatus,
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import {
  hashActivationCode,
  normalizeActivationCode,
} from "../lib/activationCodeCrypto.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import type { StudentActivationRedeemBody } from "@studyhouse/shared";

function clientIp(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0]?.trim();
  }
  return req.ip;
}

export async function redeemActivationCodeStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const body = req.body as StudentActivationRedeemBody;

  const normalized = normalizeActivationCode(body.code);
  const hash = hashActivationCode(normalized);

  const row = await prisma.activationCode.findUnique({
    where: { codeHash: hash },
    include: { course: true },
  });

  if (!row) {
    await writeAuditLog({
      actorId: studentId,
      action: "ACTIVATION_CODE_REDEEM_FAILED",
      entityType: "ActivationCode",
      entityId: null,
      metadata: { reason: "not_found" },
      req,
    });
    throw new AppError(
      "INVALID_CODE",
      "كود التفعيل غير صالح أو منتهٍ.",
      400,
    );
  }

  try {
    const out = await prisma.$transaction(async (tx) => {
      const ac = await tx.activationCode.findUnique({
        where: { id: row.id },
        include: { course: true },
      });
      if (!ac) {
        throw new AppError(
          "INVALID_CODE",
          "كود التفعيل غير صالح أو منتهٍ.",
          400,
        );
      }

      if (ac.status !== ActivationCodeStatus.ACTIVE) {
        throw new AppError(
          "CODE_INACTIVE",
          "هذا الكود غير مفعّل.",
          400,
        );
      }

      if (ac.course.status !== CourseStatus.PUBLISHED) {
        throw new AppError(
          "COURSE_UNAVAILABLE",
          "الكورس غير متاح حاليًا.",
          400,
        );
      }

      if (body.courseId && ac.courseId !== body.courseId) {
        throw new AppError(
          "CODE_WRONG_COURSE",
          "هذا الكود لا يخص هذا الكورس.",
          400,
        );
      }

      if (ac.expiresAt && ac.expiresAt.getTime() < Date.now()) {
        throw new AppError("CODE_EXPIRED", "انتهت صلاحية هذا الكود.", 400);
      }

      if (ac.usedCount >= ac.maxUses) {
        throw new AppError(
          "CODE_DEPLETED",
          "استُنفدت عدد مرات استخدام هذا الكود.",
          400,
        );
      }

      const priorRedeem = await tx.codeRedemption.findFirst({
        where: {
          activationCodeId: ac.id,
          studentId,
        },
      });
      if (priorRedeem) {
        throw new AppError(
          "ALREADY_REDEEMED",
          "سبق أن استخدمت هذا الكود.",
          409,
        );
      }

      const existingEnroll = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: ac.courseId,
          },
        },
      });

      if (existingEnroll?.status === EnrollmentStatus.ACTIVE) {
        throw new AppError(
          "ALREADY_ENROLLED",
          "أنت مسجّل بالفعل في هذا الكورس.",
          409,
        );
      }

      const bump = await tx.activationCode.updateMany({
        where: {
          id: ac.id,
          usedCount: ac.usedCount,
          status: ActivationCodeStatus.ACTIVE,
        },
        data: { usedCount: { increment: 1 } },
      });

      if (bump.count !== 1) {
        throw new AppError(
          "CONFLICT",
          "تعذّر إتمام التفعيل، أعد المحاولة.",
          409,
        );
      }

      let enrollment;
      if (existingEnroll) {
        enrollment = await tx.enrollment.update({
          where: { id: existingEnroll.id },
          data: {
            status: EnrollmentStatus.ACTIVE,
            source: EnrollmentSource.ACTIVATION_CODE,
            startedAt: existingEnroll.startedAt ?? new Date(),
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            studentId,
            courseId: ac.courseId,
            source: EnrollmentSource.ACTIVATION_CODE,
            status: EnrollmentStatus.ACTIVE,
            startedAt: new Date(),
          },
        });
      }

      await tx.codeRedemption.create({
        data: {
          activationCodeId: ac.id,
          studentId,
          courseId: ac.courseId,
          ipAddress: clientIp(req),
          userAgent:
            typeof req.headers["user-agent"] === "string"
              ? req.headers["user-agent"]
              : undefined,
        },
      });

      return {
        enrollment,
        course: ac.course,
      };
    });

    await writeAuditLog({
      actorId: studentId,
      action: "ACTIVATION_CODE_REDEEMED",
      entityType: "ActivationCode",
      entityId: row.id,
      metadata: { courseId: row.courseId },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        course: {
          id: out.course.id,
          title: out.course.title,
          slug: out.course.slug,
          pricingType: out.course.pricingType,
        },
        enrollment: {
          id: out.enrollment.id,
          status: out.enrollment.status,
        },
      },
    });
  } catch (e) {
    if (e instanceof AppError) {
      await writeAuditLog({
        actorId: studentId,
        action: "ACTIVATION_CODE_REDEEM_FAILED",
        entityType: "ActivationCode",
        entityId: row.id,
        metadata: { code: e.code },
        req,
      });
    }
    throw e;
  }
}
