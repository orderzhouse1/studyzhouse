import { PricingType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  isCourseVisibleOnIosCatalog,
  isIosPurchasablePaidCourse,
} from "../lib/iosCourseAccess.js";

describe("iosCourseAccess learning companion", () => {
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

  it("allows free courses on ios catalog", () => {
    expect(
      isCourseVisibleOnIosCatalog({
        pricingType: PricingType.FREE,
      }),
    ).toBe(true);
  });
});
