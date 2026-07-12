import { PricingType, type Prisma } from "@prisma/client";

import { AppError } from "./AppError.js";
import { isIosAppClient } from "./clientPlatform.js";
import type { Request } from "express";

export type IosCourseFields = {
  pricingType: PricingType;
};

/** @deprecated Alias kept for older call sites. */
export type IosCourseIapFields = IosCourseFields & {
  iosPurchasable?: boolean;
  appleProductId?: string | null;
};

/** Public catalog on iOS returns free courses only (no paid marketplace). */
export function iosPublishedCourseVisibilityWhere(): Prisma.CourseWhereInput {
  return { pricingType: PricingType.FREE };
}

export function iosPublishedCourseListWhere(): Prisma.CourseWhereInput {
  return iosPublishedCourseVisibilityWhere();
}

export function isCourseVisibleOnIosCatalog(course: IosCourseFields): boolean {
  return course.pricingType === PricingType.FREE;
}

/** Always false — Apple IAP purchase is not offered in this build. */
export function isIosPurchasablePaidCourse(_course: IosCourseIapFields): boolean {
  return false;
}

export function assertIosCourseCatalogVisible(
  req: Request,
  course: IosCourseFields,
): void {
  if (!isIosAppClient(req)) return;
  if (course.pricingType === PricingType.FREE) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
}

/**
 * Course detail / access on iOS (reader mode):
 * only enrolled courses (free or paid entitlements from web/Android).
 */
export function assertIosCourseDetailVisible(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isIosAppClient(req)) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
}

/** Learn on iOS: enrollment required. */
export function assertIosCourseLearnable(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isIosAppClient(req)) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
}
