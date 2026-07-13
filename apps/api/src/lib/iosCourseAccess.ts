import { PricingType, type Prisma } from "@prisma/client";
import type { Request } from "express";

import { AppError } from "./AppError.js";
import { isMobileReaderClient } from "./clientPlatform.js";

export type IosCourseFields = {
  pricingType: PricingType;
};

/** @deprecated Alias kept for older call sites. */
export type IosCourseIapFields = IosCourseFields & {
  iosPurchasable?: boolean;
  appleProductId?: string | null;
};

/**
 * Public catalog for mobile reader clients.
 * Catalog is unused in the app; API still returns FREE-only if hit.
 */
export function iosPublishedCourseVisibilityWhere(): Prisma.CourseWhereInput {
  return { pricingType: PricingType.FREE };
}

export function iosPublishedCourseListWhere(): Prisma.CourseWhereInput {
  return iosPublishedCourseVisibilityWhere();
}

export function isCourseVisibleOnIosCatalog(course: IosCourseFields): boolean {
  return course.pricingType === PricingType.FREE;
}

/** Always false — Apple IAP / Play Billing are not offered. */
export function isIosPurchasablePaidCourse(
  _course: IosCourseIapFields,
): boolean {
  return false;
}

export function assertIosCourseCatalogVisible(
  req: Request,
  course: IosCourseFields,
): void {
  if (!isMobileReaderClient(req)) return;
  if (course.pricingType === PricingType.FREE) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
}

/**
 * Course detail / access on mobile reader:
 * only enrolled courses (free or paid entitlements from web).
 */
export function assertIosCourseDetailVisible(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isMobileReaderClient(req)) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
}

/** Learn on mobile: enrollment required. */
export function assertIosCourseLearnable(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isMobileReaderClient(req)) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
}
