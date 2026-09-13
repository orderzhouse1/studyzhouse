import { PricingType, type Prisma } from "@prisma/client";
import type { Request } from "express";

import { AppError } from "./AppError.js";
import {
  isAndroidAppClient,
  isIosAppClient,
  isMobileReaderClient,
} from "./clientPlatform.js";

export type IosCourseFields = {
  pricingType: PricingType;
};

export type IosCourseIapFields = IosCourseFields & {
  iosPurchasable?: boolean;
  appleProductId?: string | null;
};

/** Paid course eligible for Apple IAP on iOS. */
export function isIosPurchasablePaidCourse(
  course: IosCourseIapFields,
): boolean {
  return (
    course.pricingType === PricingType.PAID &&
    course.iosPurchasable === true &&
    typeof course.appleProductId === "string" &&
    course.appleProductId.trim().length > 0
  );
}

/**
 * iOS public catalog: free courses + Apple-IAP mapped paid courses.
 * Android reader catalog stays free-only (unchanged).
 */
export function iosPublishedCourseVisibilityWhere(): Prisma.CourseWhereInput {
  return {
    OR: [
      { pricingType: PricingType.FREE },
      {
        pricingType: PricingType.PAID,
        iosPurchasable: true,
        appleProductId: { not: null },
      },
    ],
  };
}

/** @deprecated Prefer platform-specific helpers. */
export function iosPublishedCourseListWhere(): Prisma.CourseWhereInput {
  return iosPublishedCourseVisibilityWhere();
}

export function androidReaderCourseListWhere(): Prisma.CourseWhereInput {
  return { pricingType: PricingType.FREE };
}

export function isCourseVisibleOnIosCatalog(
  course: IosCourseIapFields,
): boolean {
  if (course.pricingType === PricingType.FREE) return true;
  return isIosPurchasablePaidCourse(course);
}

export function assertIosCourseCatalogVisible(
  req: Request,
  course: IosCourseIapFields,
): void {
  if (isIosAppClient(req)) {
    if (isCourseVisibleOnIosCatalog(course)) return;
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  if (isAndroidAppClient(req)) {
    if (course.pricingType === PricingType.FREE) return;
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
}

/**
 * iOS detail:
 * - free courses visible
 * - IAP-mapped paid courses visible (purchase or learn)
 * - other paid courses hidden
 *
 * Android reader: enrolled-only (unchanged).
 */
export function assertIosCourseDetailVisible(
  req: Request,
  course: IosCourseIapFields,
  isEnrolled: boolean,
): void {
  if (isIosAppClient(req)) {
    if (course.pricingType === PricingType.FREE) return;
    if (isIosPurchasablePaidCourse(course)) return;
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  if (isAndroidAppClient(req)) {
    if (isEnrolled) return;
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
}

/**
 * Learn access:
 * - iOS paid: enrollment required AND course must be Apple-IAP mapped
 * - Android: enrollment required (unchanged)
 */
export function assertIosCourseLearnable(
  req: Request,
  course: IosCourseIapFields,
  isEnrolled: boolean,
): void {
  if (isIosAppClient(req)) {
    if (!isEnrolled) {
      throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
    }
    if (
      course.pricingType === PricingType.PAID &&
      !isIosPurchasablePaidCourse(course)
    ) {
      throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
    }
    return;
  }
  if (isAndroidAppClient(req) || isMobileReaderClient(req)) {
    if (isEnrolled) return;
    throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
  }
}
