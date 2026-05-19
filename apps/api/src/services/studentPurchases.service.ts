import {
  EnrollmentSource,
  EnrollmentStatus,
  PaymentRequestStatus,
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type {
  StudentPurchaseItem,
  StudentPurchaseSource,
  StudentPurchaseStatus,
} from "@studyhouse/shared";

function mapEnrollmentSource(source: EnrollmentSource): StudentPurchaseSource {
  switch (source) {
    case EnrollmentSource.CLIQ_PAYMENT:
      return "CLIQ_PAYMENT";
    case EnrollmentSource.ACTIVATION_CODE:
      return "ACTIVATION_CODE";
    case EnrollmentSource.MANUAL_ADMIN:
      return "MANUAL_ADMIN";
    case EnrollmentSource.FREE:
      return "FREE";
    case EnrollmentSource.MANUAL:
      return "MANUAL";
    case EnrollmentSource.PAYMENT:
      return "CLIQ_PAYMENT";
    default:
      return "UNKNOWN";
  }
}

function mapEnrollmentStatus(status: EnrollmentStatus): StudentPurchaseStatus {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return "ACTIVE";
    case EnrollmentStatus.REVOKED:
      return "REVOKED";
    case EnrollmentStatus.COMPLETED:
      return "COMPLETED";
    default:
      return "ACTIVE";
  }
}

function mapPaymentStatus(status: PaymentRequestStatus): StudentPurchaseStatus {
  switch (status) {
    case PaymentRequestStatus.PENDING:
      return "PENDING";
    case PaymentRequestStatus.APPROVED:
      return "APPROVED";
    case PaymentRequestStatus.REJECTED:
      return "REJECTED";
    default:
      return "PENDING";
  }
}

export async function getStudentPurchasesForUser(
  userId: string,
): Promise<StudentPurchaseItem[]> {
  const [paymentRows, enrollments] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { studentId: userId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const enrollmentByCourse = new Map(
    enrollments.map((e) => [e.courseId, e]),
  );
  const paymentCourseIds = new Set(paymentRows.map((p) => p.courseId));

  const items: StudentPurchaseItem[] = [];

  for (const pr of paymentRows) {
    const enrollment = enrollmentByCourse.get(pr.courseId);
    const canLearn =
      pr.status === PaymentRequestStatus.APPROVED &&
      enrollment?.status === EnrollmentStatus.ACTIVE;
    const slug = pr.course.slug;

    items.push({
      id: pr.id,
      source: "CLIQ_PAYMENT",
      status: mapPaymentStatus(pr.status),
      course: {
        id: pr.course.id,
        title: pr.course.title,
        slug,
      },
      amount: pr.amount.toString(),
      currency: pr.currency,
      transactionReference: pr.transactionReference,
      createdAt: pr.createdAt.toISOString(),
      reviewedAt: pr.reviewedAt?.toISOString() ?? null,
      rejectionReason: pr.rejectionReason,
      canLearn,
      learnUrl: canLearn ? `/learn/${slug}` : null,
    });
  }

  for (const en of enrollments) {
    if (paymentCourseIds.has(en.courseId)) continue;

    const canLearn = en.status === EnrollmentStatus.ACTIVE;
    const slug = en.course.slug;

    items.push({
      id: en.id,
      source: mapEnrollmentSource(en.source),
      status: mapEnrollmentStatus(en.status),
      course: {
        id: en.course.id,
        title: en.course.title,
        slug,
      },
      amount: null,
      currency: null,
      transactionReference: null,
      createdAt: en.createdAt.toISOString(),
      reviewedAt: en.completedAt?.toISOString() ?? null,
      rejectionReason: null,
      canLearn,
      learnUrl: canLearn ? `/learn/${slug}` : null,
    });
  }

  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return items;
}
