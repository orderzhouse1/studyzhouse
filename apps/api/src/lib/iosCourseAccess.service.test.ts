import { PricingType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  assertIosCourseDetailVisible,
  assertIosCourseLearnable,
  isCourseVisibleOnIosCatalog,
  isIosPurchasablePaidCourse,
} from "./iosCourseAccess.js";
import { AppError } from "./AppError.js";

function iosReq() {
  return {
    get: (name: string) =>
      name.toLowerCase() === "x-client-platform" ? "ios" : undefined,
  } as never;
}

function androidReq() {
  return {
    get: (name: string) =>
      name.toLowerCase() === "x-client-platform" ? "android" : undefined,
  } as never;
}

function webReq() {
  return {
    get: () => undefined,
  } as never;
}

const iapPaid = {
  pricingType: PricingType.PAID,
  iosPurchasable: true,
  appleProductId: "studyzhouse_course_mswdh_kwrs_17",
};

const unmappedPaid = {
  pricingType: PricingType.PAID,
  iosPurchasable: false,
  appleProductId: null,
};

describe("iosCourseAccess Apple IAP mode", () => {
  it("treats mapped paid courses as iOS purchasable", () => {
    expect(isIosPurchasablePaidCourse(iapPaid)).toBe(true);
    expect(isIosPurchasablePaidCourse(unmappedPaid)).toBe(false);
  });

  it("allows free and IAP-mapped paid in iOS catalog filter", () => {
    expect(
      isCourseVisibleOnIosCatalog({ pricingType: PricingType.FREE }),
    ).toBe(true);
    expect(isCourseVisibleOnIosCatalog(iapPaid)).toBe(true);
    expect(isCourseVisibleOnIosCatalog(unmappedPaid)).toBe(false);
  });

  it("allows non-enrolled IAP paid detail on iOS for purchase", () => {
    expect(() =>
      assertIosCourseDetailVisible(iosReq(), iapPaid, false),
    ).not.toThrow();
  });

  it("blocks non-IAP paid detail on iOS even if enrolled", () => {
    expect(() =>
      assertIosCourseDetailVisible(iosReq(), unmappedPaid, true),
    ).toThrow(AppError);
  });

  it("blocks learn for non-IAP paid on iOS even when enrolled", () => {
    expect(() =>
      assertIosCourseLearnable(iosReq(), unmappedPaid, true),
    ).toThrow(AppError);
    expect(() =>
      assertIosCourseLearnable(iosReq(), iapPaid, true),
    ).not.toThrow();
  });

  it("keeps Android reader enrolled-only detail", () => {
    expect(() =>
      assertIosCourseDetailVisible(androidReq(), iapPaid, false),
    ).toThrow(AppError);
    expect(() =>
      assertIosCourseDetailVisible(androidReq(), iapPaid, true),
    ).not.toThrow();
  });

  it("does not block web clients", () => {
    expect(() =>
      assertIosCourseDetailVisible(webReq(), unmappedPaid, false),
    ).not.toThrow();
  });
});
