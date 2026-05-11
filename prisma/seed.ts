import { createHmac, randomBytes } from "node:crypto";

import {
  ActivationCodeStatus,
  CourseLevel,
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonStatus,
  PaymentMethod,
  PaymentRequestStatus,
  Prisma,
  PrismaClient,
  PricingType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log(
    "[seed] Local development only — passwords are fixed in this file; never use seed accounts or these passwords in production.",
  );
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

  await prisma.user.upsert({
    where: { email: "student2@example.com" },
    update: {
      fullName: "خالد — طالب تجريبي",
      passwordHash: studentPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "student2@example.com",
      fullName: "خالد — طالب تجريبي",
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

  const demoCourse = await prisma.course.upsert({
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

  const lessonCount = await prisma.lesson.count({
    where: { courseId: demoCourse.id },
  });
  if (lessonCount === 0) {
    const section = await prisma.courseSection.create({
      data: {
        courseId: demoCourse.id,
        title: "الوحدة الأولى — ولادة الويب",
        description: "دروس أساسية مع فيديوهات حقيقية للتجربة.",
        sortOrder: 0,
      },
    });
    await prisma.lesson.createMany({
      data: [
        {
          courseId: demoCourse.id,
          sectionId: section.id,
          title: "أول فيديو على يوتيوب — لمحة تاريخية",
          description:
            "درس قصير للتعرّف على أسلوب التعلّم عبر المنصة.",
          youtubeVideoId: "jNQXAC9IVRw",
          youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
          durationSeconds: 19,
          sortOrder: 0,
          isPreview: true,
          status: LessonStatus.PUBLISHED,
        },
        {
          courseId: demoCourse.id,
          sectionId: section.id,
          title: "درس ثانٍ للتجربة",
          description:
            "متابعة التعلّم مع فيديو عام للتحقق من الترتيب والتقدّم.",
          youtubeVideoId: "9bZkp7q19f0",
          youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
          durationSeconds: 420,
          sortOrder: 1,
          isPreview: false,
          status: LessonStatus.PUBLISHED,
        },
      ],
    });
  }

  const studentUser = await prisma.user.findUnique({
    where: { email: "student@example.com" },
  });
  if (studentUser) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: studentUser.id,
          courseId: demoCourse.id,
        },
      },
      create: {
        studentId: studentUser.id,
        courseId: demoCourse.id,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 0,
        startedAt: new Date(),
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
      },
    });

    const enrollmentRow = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentUser.id,
          courseId: demoCourse.id,
        },
      },
    });
    const firstLesson = await prisma.lesson.findFirst({
      where: {
        courseId: demoCourse.id,
        status: LessonStatus.PUBLISHED,
      },
      orderBy: { sortOrder: "asc" },
    });
    if (enrollmentRow && firstLesson) {
      await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollmentRow.id,
            lessonId: firstLesson.id,
          },
        },
        create: {
          enrollmentId: enrollmentRow.id,
          studentId: studentUser.id,
          courseId: demoCourse.id,
          lessonId: firstLesson.id,
          watchedSeconds: 12,
          isCompleted: false,
          lastWatchedAt: new Date(),
        },
        update: {},
      });
    }
  }

  const pepper =
    process.env.ACTIVATION_CODE_PEPPER ?? process.env.JWT_ACCESS_SECRET ?? "";
  const SEGMENT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function randomSeg(len: number): string {
    let s = "";
    const buf = randomBytes(len * 2);
    for (let i = 0; i < len; i++) {
      s += SEGMENT_ALPHABET[buf[i]! % SEGMENT_ALPHABET.length];
    }
    return s;
  }

  const paidActivationCourse = await prisma.course.upsert({
    where: { slug: "paid-activation-demo" },
    update: {
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.PAID,
      price: 19,
      publishedAt: new Date(),
    },
    create: {
      title: "كورس مدفوع — عرض تفعيل",
      slug: "paid-activation-demo",
      subtitle: "لاختبار أكواد التفعيل",
      description: "كورس بسيط منشور كمدفوع لاختبار تفعيل الطلاب بالكود.",
      coverImageUrl: null,
      estimatedDurationMinutes: 60,
      status: CourseStatus.PUBLISHED,
      pricingType: PricingType.PAID,
      price: 19,
      currency: "JOD",
      level: CourseLevel.BEGINNER,
      categoryId: catProgramming.id,
      createdById: adminUser.id,
      publishedAt: new Date(),
    },
  });

  if (pepper.length >= 32) {
    const plain = `STUDY-${randomSeg(4)}-${randomSeg(4)}`;
    const normalized = plain
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/−/g, "-");
    const hash = createHmac("sha256", pepper).update(normalized).digest("hex");
    const parts = normalized.split("-").filter(Boolean);
    const codePrefix =
      parts.length >= 3
        ? `${parts[0]}-${parts[1]}-****`
        : `${normalized.slice(0, 8)}…`;

    await prisma.activationCode.upsert({
      where: { codeHash: hash },
      update: {},
      create: {
        codeHash: hash,
        codePrefix,
        courseId: paidActivationCourse.id,
        status: ActivationCodeStatus.ACTIVE,
        maxUses: 100,
        usedCount: 0,
        createdById: adminUser.id,
        notes: "بذرة تجريبية — يُطبع الكود الواضح مرة في سجل التشغيل فقط",
      },
    });
    console.log(
      "[seed] Demo PAID course slug: paid-activation-demo — activation code (dev, copy now):",
      plain,
    );
  } else {
    console.warn(
      "[seed] Skipped demo activation code: set ACTIVATION_CODE_PEPPER or JWT_ACCESS_SECRET (≥32 chars).",
    );
  }

  const student2ForPayment = await prisma.user.findUnique({
    where: { email: "student2@example.com" },
  });
  if (student2ForPayment) {
    const dupPending = await prisma.paymentRequest.findFirst({
      where: {
        studentId: student2ForPayment.id,
        courseId: paidActivationCourse.id,
        status: PaymentRequestStatus.PENDING,
      },
    });
    if (!dupPending) {
      await prisma.paymentRequest.create({
        data: {
          studentId: student2ForPayment.id,
          courseId: paidActivationCourse.id,
          amount: new Prisma.Decimal("19.00"),
          currency: "JOD",
          method: PaymentMethod.CLIQ,
          status: PaymentRequestStatus.PENDING,
          transactionReference: "CLIQ-SEED-PENDING-001",
          studentNote: "بذرة: طلب قيد المراجعة لاختبار لوحة الإدارة",
          payerName: "خالد (تجريبي)",
        },
      });
      console.log(
        "[seed] Pending CliQ payment: student2@example.com → paid-activation-demo — مرجع CLIQ-SEED-PENDING-001",
      );
    }
  }

  console.log("[seed] Users ready:", {
    superAdmin: superAdmin.email,
    admin: adminUser.email,
    student: "student@example.com",
    studentDemoEmpty: "student2@example.com",
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
