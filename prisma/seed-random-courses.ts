/**
 * إضافة كورسات منشورة عشوائية للتجربة (كتالوج، اهتمامات، محفوظات).
 *
 *   pnpm db:seed-random-courses
 *   pnpm db:seed-random-courses -- --count=30
 *
 * يتطلب مستخدم ADMIN أو SUPER_ADMIN (شغّل pnpm db:seed مرة إذا لزم).
 */
import { randomBytes } from "node:crypto";

import {
  CourseLevel,
  CourseStatus,
  Prisma,
  PrismaClient,
  PricingType,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_COUNT = 24;

const THUMBNAILS = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=72",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=72",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=72",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=72",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=72",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=72",
];

const FALLBACK_CATEGORIES: Array<{
  slug: string;
  name: string;
  description: string;
}> = [
  {
    slug: "programming",
    name: "برمجة وتطوير",
    description: "مسارات تقنية بلغة عربية.",
  },
  {
    slug: "design",
    name: "تصميم وتجربة مستخدم",
    description: "أساسيات بصرية وتجربة استخدام.",
  },
  {
    slug: "business",
    name: "الأعمال",
    description: "إدارة، تسويق، وريادة.",
  },
  {
    slug: "personal-development",
    name: "التطوير الشخصي",
    description: "إنتاجية ومهارات حياتية.",
  },
  {
    slug: "language-learning",
    name: "تعلم اللغات",
    description: "لغات للمبتدئين والمتقدمين.",
  },
  {
    slug: "artificial-intelligence",
    name: "الذكاء الاصطناعي",
    description: "نماذج لغوية وأدوات ذكاء اصطناعي.",
  },
];

/** عناوين عربية — بعضها يطابق اهتمامات الطالب في الواجهة */
const TITLES_BY_CATEGORY: Record<string, string[]> = {
  programming: [
    "أساسيات البرمجة بلغة Python",
    "تطوير ويب حديث: HTML و CSS و JavaScript",
    "مقدمة في علوم الحاسوب للمبتدئين",
    "بناء تطبيقات بـ React خطوة بخطوة",
    "قواعد البيانات للمطورين",
  ],
  design: [
    "أساسيات التصميم الجرافيكي",
    "تصميم واجهات المستخدم UI",
    "مبادئ تجربة المستخدم UX",
    "أدوات التصميم للمبتدئين",
    "هوية بصرية للمشاريع الصغيرة",
  ],
  business: [
    "أساسيات ريادة الأعمال",
    "التسويق الرقمي للمشاريع الناشئة",
    "إدارة المشاريع بأسلوب عملي",
    "مهارات التفاوض في العمل",
    "خطة عمل مبسطة للمبتدئين",
  ],
  "personal-development": [
    "تطوير الذات والعادات الإنتاجية",
    "مهارات التواصل الفعّال",
    "إدارة الوقت للطلاب والموظفين",
    "القيادة الذاتية والتحفيز",
    "بناء عقلية النمو",
  ],
  "language-learning": [
    "الإنجليزية للمبتدئين — محادثة يومية",
    "قواعد اللغة العربية الفصحى",
    "مفردات إنجليزية للعمل",
    "لغة فرنسية — المستوى الأول",
    "تحضير IELTS — مقدمة",
  ],
  "artificial-intelligence": [
    "مقدمة في الذكاء الاصطناعي",
    "استخدام ChatGPT في العمل",
    "تعلم الآلة للمبتدئين",
    "أخلاقيات الذكاء الاصطناعي",
    "أتمتة المهام بالأدوات الذكية",
  ],
  "data-science": [
    "تحليل البيانات باستخدام Excel",
    "مقدمة في علوم البيانات",
    "تصوير البيانات للتقارير",
  ],
  "computer-science": [
    "خوارزميات للمبتدئين",
    "هياكل البيانات — مقدمة",
    "تحضير جامعي — مقدمة في البرمجة",
  ],
  "information-technology": [
    "أساسيات الشبكات",
    "أمن المعلومات للمستخدم",
    "دعم فني — مفاهيم أساسية",
  ],
  healthcare: [
    "مصطلحات طبية بالعربية",
    "مهارات التواصل في الرعاية الصحية",
  ],
};

const GENERIC_TITLES = [
  "مسار تعليمي مكثّف للمبتدئين",
  "دورة تطبيقية مع مشاريع قصيرة",
  "مراجعة سريعة قبل الاختبار",
  "مهارات عملية للسوق المحلي",
  "سلسلة دروس قصيرة — ابدأ اليوم",
];

const LEVELS: CourseLevel[] = [
  CourseLevel.BEGINNER,
  CourseLevel.INTERMEDIATE,
  CourseLevel.ADVANCED,
  CourseLevel.ALL_LEVELS,
];

function parseCount(): number {
  const arg = process.argv.find((a) => a.startsWith("--count="));
  if (!arg) return DEFAULT_COUNT;
  const n = Number.parseInt(arg.split("=")[1] ?? "", 10);
  return Number.isFinite(n) && n > 0 && n <= 80 ? n : DEFAULT_COUNT;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomDuration(): number {
  const options = [45, 60, 90, 120, 180, 240, 360, 480];
  return pick(options);
}

function titlesForCategory(slug: string): string[] {
  return TITLES_BY_CATEGORY[slug] ?? GENERIC_TITLES;
}

function uniqueSlug(base: string): string {
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`.slice(0, 80);
}

async function ensureCategories(
  adminId: string,
): Promise<Array<{ id: string; slug: string; name: string }>> {
  let cats = await prisma.category.findMany({
    where: { archivedAt: null },
    select: { id: true, slug: true, name: true },
  });

  if (cats.length === 0) {
    console.log("[seed-random] لا توجد تصنيفات — إنشاء تصنيفات أساسية…");
    for (const row of FALLBACK_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: row.slug },
        update: { name: row.name, description: row.description, archivedAt: null },
        create: row,
      });
    }
    cats = await prisma.category.findMany({
      where: { archivedAt: null },
      select: { id: true, slug: true, name: true },
    });
  }

  void adminId;
  return cats;
}

async function main(): Promise<void> {
  const count = parseCount();

  const admin = await prisma.user.findFirst({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!admin) {
    console.error(
      "لا يوجد مدير نشط. شغّل أولاً: pnpm db:seed\n" +
        "(أو أنشئ مستخدم ADMIN يدوياً)",
    );
    process.exit(1);
  }

  const categories = await ensureCategories(admin.id);
  if (categories.length === 0) {
    console.error("لا توجد تصنيفات متاحة.");
    process.exit(1);
  }

  const existingSlugs = new Set(
    (await prisma.course.findMany({ select: { slug: true } })).map((c) => c.slug),
  );

  let created = 0;
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    const cat = pick(categories);
    const pool = titlesForCategory(cat.slug);
    let title = pick(pool);
    let attempts = 0;
    while (usedTitles.has(title) && attempts < 12) {
      title = pick(pool);
      attempts++;
    }
    usedTitles.add(title);

    let slug = uniqueSlug(
      `rand-${cat.slug}`.replace(/[^a-z0-9-]/g, "-"),
    );
    while (existingSlugs.has(slug)) {
      slug = uniqueSlug(`rand-${cat.slug}`);
    }
    existingSlugs.add(slug);

    const isFree = Math.random() < 0.55;
    const pricingType = isFree ? PricingType.FREE : PricingType.PAID;
    const price = isFree ? null : new Prisma.Decimal(pick([9, 15, 19, 25, 35, 49]));

    await prisma.course.create({
      data: {
        title,
        slug,
        subtitle: `كورس تجريبي — ${cat.name}`,
        description:
          `${title} — محتوى تجريبي لاختبار المنصة (كتالوج، اهتمامات، محفوظات). ` +
          "يمكنك استبداله لاحقاً بمحتوى حقيقي من لوحة الإدارة.",
        coverImageUrl: pick(THUMBNAILS),
        estimatedDurationMinutes: randomDuration(),
        status: CourseStatus.PUBLISHED,
        pricingType,
        price,
        currency: "JOD",
        level: pick(LEVELS),
        categoryId: cat.id,
        createdById: admin.id,
        publishedAt: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 86400000,
        ),
      },
    });
    created++;
  }

  const total = await prisma.course.count({
    where: { status: CourseStatus.PUBLISHED },
  });

  console.log(
    `\n[seed-random] تم إنشاء ${created} كورساً منشوراً (طلبت ${count}).`,
  );
  console.log(`[seed-random] إجمالي الكورسات المنشورة الآن: ${total}`);
  console.log(`[seed-random] المنشئ: ${admin.email}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
