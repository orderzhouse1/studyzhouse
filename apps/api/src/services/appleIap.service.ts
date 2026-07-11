import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  PricingType,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { isIosPurchasablePaidCourse } from "../lib/iosCourseAccess.js";

export type AppleIapPurchaseInput = {
  productId: string;
  transactionId: string;
  purchaseDate?: string;
  verificationData?: string;
  environment?: "Sandbox" | "Production";
};

function parsePurchaseDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("VALIDATION_ERROR", "تاريخ الشراء غير صالح.", 400);
  }
  return parsed;
}

async function findIosPurchasableCourseByProductId(productId: string) {
  return prisma.course.findFirst({
    where: {
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.PAID,
      iosPurchasable: true,
      appleProductId: productId,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      pricingType: true,
      iosPurchasable: true,
      appleProductId: true,
    },
  });
}

async function findIosPurchasableCourseById(courseId: string) {
  return prisma.course.findFirst({
    where: {
      id: courseId,
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.PAID,
      iosPurchasable: true,
      appleProductId: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      pricingType: true,
      iosPurchasable: true,
      appleProductId: true,
    },
  });
}

async function unlockCourseFromApplePurchase(params: {
  studentId: string;
  courseId: string;
  appleProductId: string;
  transactionId: string;
  purchaseDate: Date;
  environment: string;
  verificationPayload?: string;
}) {
  const existingPurchase = await prisma.appleIapPurchase.findUnique({
    where: { transactionId: params.transactionId },
    select: { id: true, studentId: true, courseId: true },
  });

  if (existingPurchase) {
    if (
      existingPurchase.studentId !== params.studentId ||
      existingPurchase.courseId !== params.courseId
    ) {
      throw new AppError(
        "IAP_TRANSACTION_CONFLICT",
        "معاملة Apple هذه مرتبطة بحساب أو كورس آخر.",
        409,
      );
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: params.studentId,
          courseId: params.courseId,
        },
      },
      select: { id: true, status: true },
    });

    if (enrollment?.status === EnrollmentStatus.ACTIVE) {
      return { courseId: params.courseId, alreadyUnlocked: true };
    }
  }

  await prisma.$transaction(async (tx) => {
    const existingEnrollment = await tx.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: params.studentId,
          courseId: params.courseId,
        },
      },
    });

    if (existingEnrollment) {
      await tx.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          status: EnrollmentStatus.ACTIVE,
          source: EnrollmentSource.APPLE_IAP,
        },
      });
    } else {
      await tx.enrollment.create({
        data: {
          studentId: params.studentId,
          courseId: params.courseId,
          status: EnrollmentStatus.ACTIVE,
          source: EnrollmentSource.APPLE_IAP,
        },
      });
    }

    if (!existingPurchase) {
      await tx.appleIapPurchase.create({
        data: {
          studentId: params.studentId,
          courseId: params.courseId,
          appleProductId: params.appleProductId,
          transactionId: params.transactionId,
          purchaseDate: params.purchaseDate,
          environment: params.environment,
          verificationPayload: params.verificationPayload ?? null,
        },
      });
    }
  });

  return { courseId: params.courseId, alreadyUnlocked: false };
}

export async function verifyApplePurchaseForCourse(
  studentId: string,
  courseId: string | undefined,
  purchase: AppleIapPurchaseInput,
) {
  const course = courseId
    ? await findIosPurchasableCourseById(courseId)
    : await findIosPurchasableCourseByProductId(purchase.productId);
  if (!course || !isIosPurchasablePaidCourse(course)) {
    throw new AppError(
      "COURSE_NOT_IAP",
      "هذا الكورس غير متاح للشراء عبر Apple داخل التطبيق.",
      404,
    );
  }

  if (course.appleProductId !== purchase.productId) {
    throw new AppError(
      "IAP_PRODUCT_MISMATCH",
      "معرّف منتج Apple لا يطابق هذا الكورس.",
      400,
    );
  }

  const result = await unlockCourseFromApplePurchase({
    studentId,
    courseId: course.id,
    appleProductId: purchase.productId,
    transactionId: purchase.transactionId,
    purchaseDate: parsePurchaseDate(purchase.purchaseDate),
    environment: purchase.environment ?? "Sandbox",
    verificationPayload: purchase.verificationData,
  });

  return {
    courseId: course.id,
    courseSlug: course.slug,
    alreadyUnlocked: result.alreadyUnlocked,
  };
}

export async function restoreApplePurchasesForStudent(
  studentId: string,
  purchases: AppleIapPurchaseInput[],
) {
  const restoredCourseIds: string[] = [];
  const skipped: string[] = [];

  for (const purchase of purchases) {
    const course = await findIosPurchasableCourseByProductId(purchase.productId);
    if (!course) {
      skipped.push(purchase.productId);
      continue;
    }

    const result = await unlockCourseFromApplePurchase({
      studentId,
      courseId: course.id,
      appleProductId: purchase.productId,
      transactionId: purchase.transactionId,
      purchaseDate: parsePurchaseDate(purchase.purchaseDate),
      environment: purchase.environment ?? "Sandbox",
      verificationPayload: purchase.verificationData,
    });

    if (!restoredCourseIds.includes(result.courseId)) {
      restoredCourseIds.push(result.courseId);
    }
  }

  return { restoredCourseIds, skippedProductIds: skipped };
}
