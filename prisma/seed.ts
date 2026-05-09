import {
  CourseLevel,
  CourseStatus,
  PrismaClient,
  PricingType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const superAdminPassword = await argon2.hash("SuperAdmin123!");
  const adminPassword = await argon2.hash("Admin123456!");
  const studentPassword = await argon2.hash("Student123!");

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@example.com" },
    update: {
      fullName: "مدير المنصة",
      passwordHash: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "super@example.com",
      fullName: "مدير المنصة",
      passwordHash: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      fullName: "أحمد — مدير محتوى",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "admin@example.com",
      fullName: "أحمد — مدير محتوى",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: { jobTitle: "منسق كورسات" },
    create: {
      userId: adminUser.id,
      jobTitle: "منسق كورسات",
    },
  });

  await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {
      fullName: "سارة — طالبة",
      passwordHash: studentPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "student@example.com",
      fullName: "سارة — طالبة",
      passwordHash: studentPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  const catProgramming = await prisma.category.upsert({
    where: { slug: "programming" },
    update: {
      name: "برمجة وتطوير",
      description: "مسارات تقنية بلغة عربية واضحة.",
      archivedAt: null,
    },
    create: {
      name: "برمجة وتطوير",
      slug: "programming",
      description: "مسارات تقنية بلغة عربية واضحة.",
    },
  });

  const catDesign = await prisma.category.upsert({
    where: { slug: "design" },
    update: {
      name: "تصميم وتجربة مستخدم",
      description: "أساسيات بصرية وتجربة استخدام.",
      archivedAt: null,
    },
    create: {
      name: "تصميم وتجربة مستخدم",
      slug: "design",
      description: "أساسيات بصرية وتجربة استخدام.",
    },
  });

  await prisma.course.upsert({
    where: { slug: "arabic-web-basics" },
    update: {
      title: "أساسيات الويب للمبتدئين",
      subtitle: "نقطة انطلاق هادئة نحو بناء صفحات حديثة.",
      description:
        "كورس تجريبي من البذرة يظهر في الكتالوج العام. سنضيف الدروس والبناء التفصيلي في مراحل لاحقة — الآن نركّز على الهوية والعرض.",
      coverImageUrl: null,
      estimatedDurationMinutes: 120,
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.FREE,
      price: null,
      currency: "JOD",
      level: CourseLevel.BEGINNER,
      categoryId: catProgramming.id,
      createdById: adminUser.id,
      publishedAt: new Date(),
    },
    create: {
      title: "أساسيات الويب للمبتدئين",
      slug: "arabic-web-basics",
      subtitle: "نقطة انطلاق هادئة نحو بناء صفحات حديثة.",
      description:
        "كورس تجريبي من البذرة يظهر في الكتالوج العام. سنضيف الدروس والبناء التفصيلي في مراحل لاحقة — الآن نركّز على الهوية والعرض.",
      coverImageUrl: null,
      estimatedDurationMinutes: 120,
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.FREE,
      price: null,
      currency: "JOD",
      level: CourseLevel.BEGINNER,
      categoryId: catProgramming.id,
      createdById: adminUser.id,
      publishedAt: new Date(),
    },
  });

  console.log("[seed] Users ready:", {
    superAdmin: superAdmin.email,
    admin: adminUser.email,
    student: "student@example.com",
  });
  console.log("[seed] Categories:", catProgramming.slug, catDesign.slug);
  console.log("[seed] Demo published course slug: arabic-web-basics");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
