import type { Request, Response } from "express";
import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  PaymentRequestStatus,
  PricingType,
  Prisma,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { decimalToString } from "../lib/courseMapper.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import type {
  AdminPaymentRequestRejectBody,
  AdminPaymentRequestsQuery,
} from "@studyhouse/shared";
import { adminPaymentRequestsQuerySchema } from "@studyhouse/shared";

export async function listPaymentRequestsAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const query = adminPaymentRequestsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  ) as AdminPaymentRequestsQuery;

  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.PaymentRequestWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.courseId) {
    where.courseId = query.courseId;
  }
  if (query.search?.trim()) {
    const s = query.search.trim();
    where.AND = [
      {
        OR: [
          { student: { email: { contains: s, mode: "insensitive" } } },
          { student: { fullName: { contains: s, mode: "insensitive" } } },
          {
            transactionReference: {
              contains: s,
              mode: "insensitive",
            },
          },
        ],
      },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.paymentRequest.count({ where }),
    prisma.paymentRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            pricingType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((r) => ({
        id: r.id,
        student: {
          id: r.student.id,
          fullName: r.student.fullName,
          email: r.student.email,
        },
        course: {
          id: r.course.id,
          title: r.course.title,
          slug: r.course.slug,
        },
        paidAmount: r.amount.toString(),
        coursePrice: decimalToString(r.course.price),
        currency: r.currency,
        paymentReference: r.transactionReference,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function getPaymentRequestAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const paymentRequestId = String(
    (req.validatedParams as { paymentRequestId: string }).paymentRequestId,
  );

  const row = await prisma.paymentRequest.findFirst({
    where: { id: paymentRequestId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      course: true,
      reviewedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!row) {
    throw new AppError("NOT_FOUND", "طلب الدفع غير موجود.", 404);
  }

  let enrollment: null | {
    id: string;
    status: EnrollmentStatus;
    progressPercent: number;
  } = null;

  if (row.status === PaymentRequestStatus.APPROVED) {
    const en = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: row.studentId,
          courseId: row.courseId,
        },
      },
      select: {
        id: true,
        status: true,
        progressPercent: true,
      },
    });
    enrollment = en;
  }

  res.status(200).json({
    success: true,
    data: {
      id: row.id,
      status: row.status,
      paidAmount: row.amount.toString(),
      currency: row.currency,
      paymentReference: row.transactionReference,
      payerName: row.payerName,
      payerPhone: row.payerPhone,
      note: row.studentNote,
      rejectionReason: row.rejectionReason,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedBy: row.reviewedBy
        ? {
            id: row.reviewedBy.id,
            fullName: row.reviewedBy.fullName,
            email: row.reviewedBy.email,
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      student: row.student,
      course: {
        id: row.course.id,
        title: row.course.title,
        slug: row.course.slug,
        pricingType: row.course.pricingType,
        coursePrice: decimalToString(row.course.price),
        currency: row.course.currency,
        status: row.course.status,
      },
      enrollment,
    },
  });
}

export async function approvePaymentRequestAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth?.userId;
  if (!actorId) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const paymentRequestId = String(
    (req.validatedParams as { paymentRequestId: string }).paymentRequestId,
  );

  const out = await prisma.$transaction(async (tx) => {
    const pr = await tx.paymentRequest.findFirst({
      where: { id: paymentRequestId },
      include: { course: true },
    });

    if (!pr) {
      throw new AppError("NOT_FOUND", "طلب الدفع غير موجود.", 404);
    }

    if (pr.status !== PaymentRequestStatus.PENDING) {
      throw new AppError(
        "INVALID_STATUS",
        "يمكن قبول الطلبات قيد المراجعة فقط.",
        400,
      );
    }

    if (
      pr.course.status !== CourseStatus.PUBLISHED ||
      pr.course.pricingType !== PricingType.PAID
    ) {
      throw new AppError(
        "COURSE_INVALID",
        "الكورس لم يعد متاحًا للتفعيل عبر الدفع.",
        400,
      );
    }

    const existingEnroll = await tx.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: pr.studentId,
          courseId: pr.courseId,
        },
      },
    });

    if (existingEnroll?.status === EnrollmentStatus.ACTIVE) {
      throw new AppError(
        "ALREADY_ENROLLED",
        "الطالب مسجّل بالفعل في هذا الكورس.",
        409,
      );
    }

    let enrollment;
    if (existingEnroll) {
      enrollment = await tx.enrollment.update({
        where: { id: existingEnroll.id },
        data: {
          status: EnrollmentStatus.ACTIVE,
          source: EnrollmentSource.CLIQ_PAYMENT,
          startedAt: existingEnroll.startedAt ?? new Date(),
        },
      });
    } else {
      enrollment = await tx.enrollment.create({
        data: {
          studentId: pr.studentId,
          courseId: pr.courseId,
          source: EnrollmentSource.CLIQ_PAYMENT,
          status: EnrollmentStatus.ACTIVE,
          startedAt: new Date(),
        },
      });
    }

    await tx.paymentRequest.update({
      where: { id: pr.id },
      data: {
        status: PaymentRequestStatus.APPROVED,
        reviewedById: actorId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    return {
      enrollment,
      course: pr.course,
    };
  });

  await writeAuditLog({
    actorId,
    action: "PAYMENT_REQUEST_APPROVED",
    entityType: "PaymentRequest",
    entityId: paymentRequestId,
    metadata: {
      studentId: out.enrollment.studentId,
      courseId: out.course.id,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      paymentRequestId,
      status: PaymentRequestStatus.APPROVED,
      enrollment: {
        id: out.enrollment.id,
        status: out.enrollment.status,
      },
      course: {
        id: out.course.id,
        title: out.course.title,
        slug: out.course.slug,
        pricingType: out.course.pricingType,
      },
    },
  });
}

export async function rejectPaymentRequestAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth?.userId;
  if (!actorId) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const paymentRequestId = String(
    (req.validatedParams as { paymentRequestId: string }).paymentRequestId,
  );
  const body = req.body as AdminPaymentRequestRejectBody;

  const existing = await prisma.paymentRequest.findFirst({
    where: { id: paymentRequestId },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "طلب الدفع غير موجود.", 404);
  }

  if (existing.status !== PaymentRequestStatus.PENDING) {
    throw new AppError(
      "INVALID_STATUS",
      "يمكن رفض الطلبات قيد المراجعة فقط.",
      400,
    );
  }

  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      status: PaymentRequestStatus.REJECTED,
      reviewedById: actorId,
      reviewedAt: new Date(),
      rejectionReason: body.rejectionReason.trim(),
    },
  });

  await writeAuditLog({
    actorId,
    action: "PAYMENT_REQUEST_REJECTED",
    entityType: "PaymentRequest",
    entityId: paymentRequestId,
    metadata: { reason: body.rejectionReason.trim() },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      paymentRequestId,
      status: PaymentRequestStatus.REJECTED,
      rejectionReason: body.rejectionReason.trim(),
    },
  });
}
