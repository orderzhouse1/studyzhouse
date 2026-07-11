/**
 * Marks one published paid course for iOS In-App Purchase testing.
 *
 * Usage (from repo root, with DATABASE_URL set to target env):
 *   npx tsx prisma/seed-ios-iap-test-course.ts
 *
 * Optional env:
 *   IOS_IAP_TEST_COURSE_SLUG=mswdh-kwrs-19
 *   IOS_IAP_TEST_PRODUCT_ID=com.studyzhouse.app.course.test1
 */
import { CourseStatus, PricingType } from "@prisma/client";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_SLUG = "mswdh-kwrs-19";
const DEFAULT_PRODUCT_ID = "com.studyzhouse.app.course.test1";

async function main() {
  const slug = process.env.IOS_IAP_TEST_COURSE_SLUG?.trim() || DEFAULT_SLUG;
  const appleProductId =
    process.env.IOS_IAP_TEST_PRODUCT_ID?.trim() || DEFAULT_PRODUCT_ID;

  let course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: { id: true, title: true, slug: true, pricingType: true },
  });

  if (!course) {
    course = await prisma.course.findFirst({
      where: { status: CourseStatus.PUBLISHED, pricingType: PricingType.PAID },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, pricingType: true },
    });
  }

  if (!course) {
    throw new Error("No published paid course found to mark as iOS IAP test.");
  }

  const updated = await prisma.course.update({
    where: { id: course.id },
    data: {
      iosPurchasable: true,
      appleProductId,
      pricingType: PricingType.PAID,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      pricingType: true,
      iosPurchasable: true,
      appleProductId: true,
      status: true,
    },
  });

  console.log("iOS IAP test course configured:");
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
