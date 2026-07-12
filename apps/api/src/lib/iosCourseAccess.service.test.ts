import { PricingType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  assertIosCourseDetailVisible,
  isCourseVisibleOnIosCatalog,
  isIosPurchasablePaidCourse,
} from "../lib/iosCourseAccess.js";
import { AppError } from "../lib/AppError.js";

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

describe("iosCourseAccess strict reader mode", () => {
  it("never treats paid courses as iOS purchasable", () => {
    expect(
      isIosPurchasablePaidCourse({
        pricingType: PricingType.PAID,
        iosPurchasable: true,
        appleProductId: "com.studyzhouse.app.course.test1",
      }),
    ).toBe(false);
  });

  it("blocks paid courses from iOS catalog", () => {
    expect(
      isCourseVisibleOnIosCatalog({
        pricingType: PricingType.PAID,
      }),
    ).toBe(false);
  });

  it("allows free courses in API catalog list filter (client hides Explore)", () => {
    expect(
      isCourseVisibleOnIosCatalog({
        pricingType: PricingType.FREE,
      }),
    ).toBe(true);
  });

  it("blocks non-enrolled course detail on iOS including free", () => {
    expect(() =>
      assertIosCourseDetailVisible(
        iosReq(),
        { pricingType: PricingType.FREE },
        false,
      ),
    ).toThrow(AppError);

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

  it("does not block Android course detail when not enrolled", () => {
    expect(() =>
      assertIosCourseDetailVisible(
        androidReq(),
        { pricingType: PricingType.PAID },
        false,
      ),
    ).not.toThrow();
  });
});
