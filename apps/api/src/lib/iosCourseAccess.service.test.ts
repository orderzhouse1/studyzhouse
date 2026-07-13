import { PricingType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  assertIosCourseDetailVisible,
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

describe("iosCourseAccess mobile reader mode", () => {
  it("never treats paid courses as iOS purchasable", () => {
    expect(
      isIosPurchasablePaidCourse({
        pricingType: PricingType.PAID,
        iosPurchasable: true,
        appleProductId: "com.studyzhouse.app.course.test1",
      }),
    ).toBe(false);
  });

  it("blocks paid courses from mobile catalog filter", () => {
    expect(
      isCourseVisibleOnIosCatalog({
        pricingType: PricingType.PAID,
      }),
    ).toBe(false);
  });

  it("allows free courses in API catalog list filter", () => {
    expect(
      isCourseVisibleOnIosCatalog({
        pricingType: PricingType.FREE,
      }),
    ).toBe(true);
  });

  it("blocks non-enrolled course detail on iOS", () => {
    expect(() =>
      assertIosCourseDetailVisible(
        iosReq(),
        { pricingType: PricingType.PAID },
        false,
      ),
    ).toThrow(AppError);

    expect(() =>
      assertIosCourseDetailVisible(
        iosReq(),
        { pricingType: PricingType.PAID },
        true,
      ),
    ).not.toThrow();
  });

  it("blocks non-enrolled course detail on Android reader", () => {
    expect(() =>
      assertIosCourseDetailVisible(
        androidReq(),
        { pricingType: PricingType.PAID },
        false,
      ),
    ).toThrow(AppError);

    expect(() =>
      assertIosCourseDetailVisible(
        androidReq(),
        { pricingType: PricingType.PAID },
        true,
      ),
    ).not.toThrow();
  });

  it("does not block web clients without platform header", () => {
    expect(() =>
      assertIosCourseDetailVisible(
        webReq(),
        { pricingType: PricingType.PAID },
        false,
      ),
    ).not.toThrow();
  });
});
