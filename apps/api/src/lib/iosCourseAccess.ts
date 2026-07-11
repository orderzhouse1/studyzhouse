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

/** Public catalog on iOS is free courses only (learning companion / reader model). */
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
 * Course detail / access on iOS:
 * - free courses: always allowed
 * - paid courses: only when the student has an active enrollment
 */
export function assertIosCourseDetailVisible(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isIosAppClient(req)) return;
  if (course.pricingType === PricingType.FREE) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
}

export function assertIosCourseLearnable(
  req: Request,
  course: IosCourseFields,
  isEnrolled: boolean,
): void {
  if (!isIosAppClient(req)) return;
  if (course.pricingType === PricingType.FREE) return;
  if (isEnrolled) return;
  throw new AppError("NOT_FOUND", "الكورس غير موجود أو غير منشور.", 404);
}
