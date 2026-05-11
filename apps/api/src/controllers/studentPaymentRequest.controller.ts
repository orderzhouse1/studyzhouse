import type { Request, Response } from "express";
import {
  CourseStatus,
  EnrollmentStatus,
  PaymentMethod,
  PaymentRequestStatus,
  PricingType,
  Prisma,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { decimalToString } from "../lib/courseMapper.js";
import { prisma } from "../lib/prisma.js";
import type { StudentPaymentRequestCreateBody } from "@studyhouse/shared";

export async function createPaymentRequestStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const body = req.body as StudentPaymentRequestCreateBody;

  const course = await prisma.course.findFirst({
    where: { id: body.courseId, status: CourseStatus.PUBLISHED },
  });

  if (!course) {
    throw new AppError(
      "COURSE_NOT_FOUND",
      "الكورس غير متاح أو غير منشور.",
      404,
    );
  }

  if (course.pricingType !== PricingType.PAID) {
    throw new AppError(
      "NOT_PAID_COURSE",
      "هذا الكورس مجاني — لا حاجة لطلب دفع.",
      400,
    );
  }

  if (course.price === null) {
    throw new AppError(
      "INVALID_COURSE_PRICE",
      "سعر الكورس غير محدّد.",
      400,
    );
  }

  const existingEnroll = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId: course.id,
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

  const pendingDuplicate = await prisma.paymentRequest.findFirst({
    where: {
      studentId,
      courseId: course.id,
      status: PaymentRequestStatus.PENDING,
    },
  });

  if (pendingDuplicate) {
    throw new AppError(
      "PENDING_EXISTS",
      "لديك طلب دفع قيد المراجعة لهذا الكورس.",
      409,
    );
  }

  const amountDec = new Prisma.Decimal(body.paidAmount);

  const row = await prisma.paymentRequest.create({
    data: {
      studentId,
      courseId: course.id,
      amount: amountDec,
      currency: course.currency,
      method: PaymentMethod.CLIQ,
      status: PaymentRequestStatus.PENDING,
      transactionReference: body.paymentReference.trim(),
      studentNote: body.note?.trim() ? body.note.trim() : null,
      payerName: body.payerName?.trim() ? body.payerName.trim() : null,
      payerPhone: body.payerPhone?.trim() ? body.payerPhone.trim() : null,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          pricingType: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: row.id,
      status: row.status,
      paidAmount: row.amount.toString(),
      currency: row.currency,
      paymentReference: row.transactionReference,
      course: {
        id: row.course.id,
        title: row.course.title,
        slug: row.course.slug,
        pricingType: row.course.pricingType,
        coursePrice: decimalToString(row.course.price),
        currency: row.course.currency,
      },
      createdAt: row.createdAt.toISOString(),
    },
  });
}

export async function listPaymentRequestsStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;

  const rows = await prisma.paymentRequest.findMany({
    where: { studentId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          pricingType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        paidAmount: r.amount.toString(),
        currency: r.currency,
        paymentReference: r.transactionReference,
        course: r.course,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        rejectionReason: r.rejectionReason,
      })),
    },
  });
}
