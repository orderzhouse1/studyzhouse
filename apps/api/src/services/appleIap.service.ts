import {
  AppleIapPurchaseStatus,
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  PricingType,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import {
  assertAppleIapConfigured,
  decodeAppleNotificationPayload,
  decodeAppleSignedTransactionForNotification,
  verifyAppleTransactionWithServerApi,
} from "../lib/appleAppStoreServer.js";
import { isIosPurchasablePaidCourse } from "../lib/iosCourseAccess.js";
import { prisma } from "../lib/prisma.js";

export type AppleIapPurchaseInput = {
  productId: string;
  transactionId: string;
  purchaseDate?: string;
  verificationData?: string;
  environment?: "Sandbox" | "Production";
};

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
  originalTransactionId?: string | null;
  purchaseDate: Date;
  environment: string;
  verificationPayload?: string;
  rawSignedTransaction?: string;
}) {
  const existingPurchase = await prisma.appleIapPurchase.findUnique({
    where: { transactionId: params.transactionId },
    select: {
      id: true,
      studentId: true,
      courseId: true,
      status: true,
    },
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

    if (existingPurchase.status === AppleIapPurchaseStatus.REVOKED) {
      throw new AppError(
        "IAP_TRANSACTION_REVOKED",
        "تم إلغاء عملية الشراء من Apple.",
        400,
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
          originalTransactionId: params.originalTransactionId ?? null,
          purchaseDate: params.purchaseDate,
          environment: params.environment,
          status: AppleIapPurchaseStatus.ACTIVE,
          verificationPayload: params.verificationPayload ?? null,
          rawSignedTransaction: params.rawSignedTransaction ?? null,
        },
      });
    } else {
      await tx.appleIapPurchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: AppleIapPurchaseStatus.ACTIVE,
          revokedAt: null,
          originalTransactionId: params.originalTransactionId ?? undefined,
          rawSignedTransaction: params.rawSignedTransaction ?? undefined,
          verificationPayload: params.verificationPayload ?? undefined,
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
  assertAppleIapConfigured();

  if (!purchase.verificationData?.trim()) {
    throw new AppError(
      "IAP_VERIFICATION_DATA_REQUIRED",
      "بيانات التحقق من Apple مطلوبة.",
      400,
    );
  }

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

  const verified = await verifyAppleTransactionWithServerApi({
    transactionId: purchase.transactionId,
    expectedProductId: purchase.productId,
    clientSignedTransaction: purchase.verificationData,
  });

  if (verified.productId !== course.appleProductId) {
    throw new AppError(
      "IAP_PRODUCT_MISMATCH",
      "معرّف منتج Apple لا يطابق هذا الكورس.",
      400,
    );
  }

  const result = await unlockCourseFromApplePurchase({
    studentId,
    courseId: course.id,
    appleProductId: verified.productId,
    transactionId: verified.transactionId,
    originalTransactionId: verified.originalTransactionId,
    purchaseDate: verified.purchaseDate,
    environment: verified.environment,
    verificationPayload: purchase.verificationData,
    rawSignedTransaction: verified.rawSignedTransaction,
  });

  return {
    courseId: course.id,
    courseSlug: course.slug,
    alreadyUnlocked: result.alreadyUnlocked,
    productId: verified.productId,
    transactionId: verified.transactionId,
  };
}

export async function restoreApplePurchasesForStudent(
  studentId: string,
  purchases: AppleIapPurchaseInput[],
) {
  assertAppleIapConfigured();

  const restoredCourseIds: string[] = [];
  const skippedProductIds: string[] = [];
  const errors: Array<{ productId: string; code: string }> = [];

  for (const purchase of purchases) {
    if (!purchase.verificationData?.trim()) {
      skippedProductIds.push(purchase.productId);
      continue;
    }

    const course = await findIosPurchasableCourseByProductId(purchase.productId);
    if (!course || !isIosPurchasablePaidCourse(course)) {
      skippedProductIds.push(purchase.productId);
      continue;
    }

    try {
      const verified = await verifyAppleTransactionWithServerApi({
        transactionId: purchase.transactionId,
        expectedProductId: purchase.productId,
        clientSignedTransaction: purchase.verificationData,
      });

      const result = await unlockCourseFromApplePurchase({
        studentId,
        courseId: course.id,
        appleProductId: verified.productId,
        transactionId: verified.transactionId,
        originalTransactionId: verified.originalTransactionId,
        purchaseDate: verified.purchaseDate,
        environment: verified.environment,
        verificationPayload: purchase.verificationData,
        rawSignedTransaction: verified.rawSignedTransaction,
      });

      if (!restoredCourseIds.includes(result.courseId)) {
        restoredCourseIds.push(result.courseId);
      }
    } catch (err) {
      const code = err instanceof AppError ? err.code : "IAP_RESTORE_FAILED";
      errors.push({ productId: purchase.productId, code });
    }
  }

  return { restoredCourseIds, skippedProductIds, errors };
}

export async function listStudentCourseEntitlements(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: EnrollmentStatus.ACTIVE,
    },
    select: {
      id: true,
      courseId: true,
      source: true,
      progressPercent: true,
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          pricingType: true,
          appleProductId: true,
          iosPurchasable: true,
          status: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const purchases = await prisma.appleIapPurchase.findMany({
    where: {
      studentId,
      status: AppleIapPurchaseStatus.ACTIVE,
    },
    select: {
      courseId: true,
      appleProductId: true,
      transactionId: true,
      originalTransactionId: true,
      purchaseDate: true,
      environment: true,
    },
  });

  const purchaseByCourse = new Map(purchases.map((p) => [p.courseId, p]));

  return {
    entitlements: enrollments.map((e) => ({
      enrollmentId: e.id,
      courseId: e.courseId,
      courseSlug: e.course.slug,
      title: e.course.title,
      pricingType: e.course.pricingType,
      source: e.source,
      progressPercent: e.progressPercent,
      appleProductId: e.course.appleProductId,
      iosPurchasable: e.course.iosPurchasable,
      applePurchase: purchaseByCourse.get(e.courseId) ?? null,
    })),
  };
}

async function revokeApplePurchaseAccess(params: {
  transactionId: string;
  originalTransactionId?: string | null;
  productId: string;
}) {
  const purchase =
    (await prisma.appleIapPurchase.findUnique({
      where: { transactionId: params.transactionId },
    })) ??
    (params.originalTransactionId
      ? await prisma.appleIapPurchase.findFirst({
          where: { originalTransactionId: params.originalTransactionId },
          orderBy: { createdAt: "desc" },
        })
      : null);

  if (!purchase) {
    return { revoked: false, reason: "PURCHASE_NOT_FOUND" as const };
  }

  if (purchase.appleProductId !== params.productId) {
    return { revoked: false, reason: "PRODUCT_MISMATCH" as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.appleIapPurchase.update({
      where: { id: purchase.id },
      data: {
        status: AppleIapPurchaseStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    const enrollment = await tx.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: purchase.studentId,
          courseId: purchase.courseId,
        },
      },
    });

    if (
      enrollment &&
      enrollment.source === EnrollmentSource.APPLE_IAP &&
      enrollment.status === EnrollmentStatus.ACTIVE
    ) {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: EnrollmentStatus.REVOKED },
      });
    }
  });

  return { revoked: true, reason: "OK" as const };
}

/**
 * App Store Server Notifications V2 handler (refund / revoke).
 * Requires Apple IAP env; verifies signed payload structure lightly via decode.
 */
export async function handleAppleIapServerNotification(signedPayload: string) {
  const config = assertAppleIapConfigured();
  const notification = decodeAppleNotificationPayload(signedPayload);
  const type = (notification.notificationType ?? "").toUpperCase();
  const signedTxn = notification.data?.signedTransactionInfo?.trim();

  if (!signedTxn) {
    return {
      handled: false,
      notificationType: type || null,
      reason: "NO_TRANSACTION" as const,
    };
  }

  const txn = decodeAppleSignedTransactionForNotification(
    signedTxn,
    config.bundleId,
  );

  const revokeTypes = new Set([
    "REFUND",
    "REVOKE",
    "ONE_TIME_CHARGE_REFUNDED",
  ]);

  if (!revokeTypes.has(type) && !txn.revocationDate) {
    return {
      handled: true,
      notificationType: type,
      reason: "IGNORED_TYPE" as const,
      productId: txn.productId,
    };
  }

  const result = await revokeApplePurchaseAccess({
    transactionId: txn.transactionId,
    originalTransactionId: txn.originalTransactionId,
    productId: txn.productId,
  });

  return {
    handled: true,
    notificationType: type,
    productId: txn.productId,
    transactionId: txn.transactionId,
    ...result,
  };
}
