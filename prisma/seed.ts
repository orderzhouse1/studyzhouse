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

  /** تصنيفات إضافية للكتالوج وشريط «مجالات رئيسية» على الصفحة الرئيسية */
  const extraCategories: { slug: string; name: string; description: string }[] =
    [
      {
        slug: "business",
        name: "الأعمال",
        description: "إدارة، تسويق، ريادة أعمال، ومهارات مكتبية.",
      },
      {
        slug: "artificial-intelligence",
        name: "الذكاء الاصطناعي",
        description: "تعلم الآلة، النماذج اللغوية، وأدوات الذكاء الاصطناعي.",
      },
      {
        slug: "data-science",
        name: "علوم البيانات",
        description: "تحليل بيانات، إحصاء، وتصوير معلومات.",
      },
      {
        slug: "computer-science",
        name: "علوم الحاسوب",
        description: "خوارزميات، هياكل بيانات، وأسس علوم الحاسوب.",
      },
      {
        slug: "information-technology",
        name: "تقنية المعلومات",
        description: "شبكات، أنظمة، دعم فني، وأمن معلومات.",
      },
      {
        slug: "personal-development",
        name: "التطوير الشخصي",
        description: "إنتاجية، عادات، تواصل، وتنمية ذاتية.",
      },
      {
        slug: "healthcare",
        name: "الرعاية الصحية",
        description: "محتوى صحي تعليمي ومهارات مساندة للقطاع الصحي.",
      },
      {
        slug: "language-learning",
        name: "تعلم اللغات",
        description: "عربي، إنجليزي، ولغات أخرى للمبتدئين والمتقدمين.",
      },
    ];

  for (const row of extraCategories) {
    await prisma.category.upsert({
      where: { slug: row.slug },
      update: {
        name: row.name,
        description: row.description,
        archivedAt: null,
      },
      create: {
        slug: row.slug,
        name: row.name,
        description: row.description,
      },
    });
  }

  /**
   * كورسات منشورة لأول تصنيفات تظهر في «الأكثر شعبية حسب الفئة»
   * (الواجهة تطلب التصنيفات مرتبة بالاسم asc — عادةً: الأعمال، التطوير الشخصي، الذكاء الاصطناعي).
   */
  const thumbnail =
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=72";
  const popularByCategorySeed: {
    categorySlug: string;
    courses: {
      slug: string;
      title: string;
      subtitle: string;
      description: string;
    }[];
  }[] = [
    {
      categorySlug: "business",
      courses: [
        {
          slug: "seed-biz-leadership-basics",
          title: "أساسيات القيادة في بيئة العمل",
          subtitle: "مهارات إدارية للمبتدئين",
          description:
            "مقدمة عملية للتواصل مع الفريق، توزيع المهام، واتخاذ قرارات واضحة في بيئات العمل العربية.",
        },
        {
          slug: "seed-biz-marketing-intro",
          title: "مقدمة في التسويق الرقمي",
          subtitle: "قنوات واستراتيجيات أولية",
          description:
            "استكشاف القنوات الرئيسية، صياغة رسالة العلامة، ومؤشرات بسيطة لقياس الأداء دون تعقيد.",
        },
        {
          slug: "seed-biz-finance-literacy",
          title: "ثقافة مالية للمشاريع الصغيرة",
          subtitle: "تدفقات نقدية وميزانيات",
          description:
            "قراءة بسيطة للقوائم المالية، تقدير التكلفة، والتخطيط المالي اليومي لصاحب مشروع أو فريق صغير.",
        },
      ],
    },
    {
      categorySlug: "personal-development",
      courses: [
        {
          slug: "seed-pd-productivity-system",
          title: "نظام إنتاجية خفيف لأسبوعك",
          subtitle: "عادات وتخطيط يومي",
          description:
            "جمع المهام، أولويات بسيطة، وتقليل التشتت — مناسب للمتعلمين الذين يريدون انطلاقة هادئة.",
        },
        {
          slug: "seed-pd-communication-habits",
          title: "عادات تواصل أوضح",
          subtitle: "استماع وصياغة",
          description:
            "تمارين قصيرة لصياغة الطلبات، إعادة الصياغة، والتعامل مع الملاحظات في بيئة عمل أو دراسة.",
        },
        {
          slug: "seed-pd-mindset-growth",
          title: "عقلية النمو في التعلّم المستمر",
          subtitle: "من التجربة إلى التحسين",
          description:
            "كيف تبني أهدافًا قابلة للقياس، تتعلم من الأخطاء، وتحافط على حماس معقول دون إرهاق.",
        },
      ],
    },
    {
      categorySlug: "artificial-intelligence",
      courses: [
        {
          slug: "seed-ai-landscape-intro",
          title: "مشهد الذكاء الاصطناعي للمبتدئين",
          subtitle: "مفاهيم دون رياضيات ثقيلة",
          description:
            "نظرة على التعلم الآلي، النماذج اللغوية، وأين تُستخدم الأدوات اليوم — تمهيد قبل الدخول في تطبيقات عملية.",
        },
        {
          slug: "seed-ai-prompting-basics",
          title: "أساسيات صياغة الطلبات للنماذج اللغوية",
          subtitle: "وضوح وسياق وتقييد المخرجات",
          description:
            "أنماط طلبات آمنة، تجنب التضليل، وتحسين جودة الإجابات عند استخدام أدوات توليد النصوص.",
        },
        {
          slug: "seed-ai-ethics-privacy",
          title: "اعتبارات أخلاقية وخصوصية عند استخدام الذكاء الاصطناعي",
          subtitle: "للمحترفين والطلاب",
          description:
            "بيانات حساسة، التحيز في المخرجات، والتحقق من المعلومات — إطار عملي قصير قبل اعتماد الأدوات في العمل.",
        },
      ],
    },
  ];

  for (const block of popularByCategorySeed) {
    const cat = await prisma.category.findUnique({
      where: { slug: block.categorySlug },
    });
    if (!cat) {
      console.warn(
        `[seed] Skip popular courses: category slug not found: ${block.categorySlug}`,
      );
      continue;
    }
    for (const c of block.courses) {
      await prisma.course.upsert({
        where: { slug: c.slug },
        update: {
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          coverImageUrl: thumbnail,
          estimatedDurationMinutes: 180,
          status: CourseStatus.PUBLISHED,
          pricingType: PricingType.FREE,
          price: null,
          currency: "JOD",
          level: CourseLevel.ALL_LEVELS,
          categoryId: cat.id,
          createdById: adminUser.id,
          publishedAt: new Date(),
        },
        create: {
          title: c.title,
          slug: c.slug,
          subtitle: c.subtitle,
          description: c.description,
          coverImageUrl: thumbnail,
          estimatedDurationMinutes: 180,
          status: CourseStatus.PUBLISHED,
          pricingType: PricingType.FREE,
          price: null,
          currency: "JOD",
          level: CourseLevel.ALL_LEVELS,
          categoryId: cat.id,
          createdById: adminUser.id,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log(
    "[seed] Published demo courses for popular-by-category (business, personal-development, artificial-intelligence).",
  );

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
    await prisma.activationCode.upsert({
      where: { codeHash: hash },
      update: {},
      create: {
        codeHash: hash,
        codePrefix: normalized,
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

  await prisma.appSetting.upsert({
    where: { key: "platform_governance" },
    update: {},
    create: {
      key: "platform_governance",
      valueJson: {
        platformName: "Studyhouse",
        supportEmail: "support@studyhouse.app",
        cliqAlias: "BATMAN0",
        cliqInstructions:
          "حوّل المبلغ إلى معرّف CliQ أعلاه، ثم أرسل طلب التفعيل مع رقم العملية أو صورة الإيصال.",
        allowStudentSignup: true,
        maintenanceMode: false,
      },
    },
  });
  console.log("[seed] Platform CliQ alias: BATMAN0 (platform_governance)");

  console.log("[seed] Users ready:", {
    superAdmin: superAdmin.email,
    admin: adminUser.email,
    student: "student@example.com",
    studentDemoEmpty: "student2@example.com",
  });
  console.log(
    "[seed] Categories:",
    [
      catProgramming.slug,
      catDesign.slug,
      ...extraCategories.map((c) => c.slug),
    ].join(", "),
  );
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
