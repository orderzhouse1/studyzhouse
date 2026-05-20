/**
 * حذف كل الكورسات والبيانات المرتبطة بها (دروس، أقسام، تسجيلات، مدفوعات، أكواد).
 * يُبقي: المستخدمين، التصنيفات، ملفات الطلاب، سجلات التدقيق.
 *
 * الاستخدام (محلي أو إنتاج — احذر):
 *   pnpm db:clear-courses -- --confirm
 *
 * للإنتاج تأكد أن DATABASE_URL يشير لقاعدة الإنتاج الصحيحة.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mustConfirm(): void {
  const ok = process.argv.includes("--confirm");
  if (!ok) {
    console.error(
      "\n⚠️  هذا الأمر يحذف كل الكورسات نهائيًا.\n" +
        "للتنفيذ أضف: --confirm\n\n" +
        "مثال: pnpm db:clear-courses -- --confirm\n",
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  mustConfirm();

  const dbUrl = process.env.DATABASE_URL ?? "";
  const hostHint = dbUrl.replace(/:[^:@]+@/, ":****@").slice(0, 80);
  console.log(`[clear-courses] DATABASE_URL → ${hostHint}…\n`);

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true },
  });

  if (courses.length === 0) {
    console.log("لا توجد كورسات في القاعدة.");
    return;
  }

  console.log(`سيتم حذف ${courses.length} كورسًا:\n`);
  for (const c of courses) {
    console.log(`  • ${c.title} (${c.slug})`);
  }
  console.log("");

  const ids = courses.map((c) => c.id);

  const counts = await prisma.$transaction(async (tx) => {
    const lessonProgress = await tx.lessonProgress.deleteMany({
      where: { courseId: { in: ids } },
    });
    const codeRedemptions = await tx.codeRedemption.deleteMany({
      where: { courseId: { in: ids } },
    });
    const paymentRequests = await tx.paymentRequest.deleteMany({
      where: { courseId: { in: ids } },
    });
    const enrollments = await tx.enrollment.deleteMany({
      where: { courseId: { in: ids } },
    });
    const activationCodes = await tx.activationCode.deleteMany({
      where: { courseId: { in: ids } },
    });
    const lessons = await tx.lesson.deleteMany({
      where: { courseId: { in: ids } },
    });
    const sections = await tx.courseSection.deleteMany({
      where: { courseId: { in: ids } },
    });
    const deletedCourses = await tx.course.deleteMany({
      where: { id: { in: ids } },
    });

    return {
      lessonProgress: lessonProgress.count,
      codeRedemptions: codeRedemptions.count,
      paymentRequests: paymentRequests.count,
      enrollments: enrollments.count,
      activationCodes: activationCodes.count,
      lessons: lessons.count,
      sections: sections.count,
      courses: deletedCourses.count,
    };
  });

  console.log("تم الحذف:");
  console.log(`  كورسات: ${counts.courses}`);
  console.log(`  أقسام: ${counts.sections}`);
  console.log(`  دروس: ${counts.lessons}`);
  console.log(`  تسجيلات: ${counts.enrollments}`);
  console.log(`  طلبات دفع: ${counts.paymentRequests}`);
  console.log(`  أكواد تفعيل: ${counts.activationCodes}`);
  console.log(`  استرداد أكواد: ${counts.codeRedemptions}`);
  console.log(`  تقدّم دروس: ${counts.lessonProgress}`);
  console.log("\nيمكنك الآن إضافة كورساتك الحقيقية من لوحة الإدارة.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
