/**
 * إنشاء أو تحديث حساب طالب (كلمة المرور تُمرَّر عبر المتغيرات فقط).
 *
 *   STUDENT_EMAIL=ahmed@example.com STUDENT_PASSWORD='...' pnpm db:create-student
 *   STUDENT_FULL_NAME='أحمد' (اختياري)
 */
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const emailRaw = process.env.STUDENT_EMAIL?.trim();
  const password = process.env.STUDENT_PASSWORD;
  const fullName = process.env.STUDENT_FULL_NAME?.trim() || "طالب";

  if (!emailRaw || !password) {
    console.error(
      "حدّد STUDENT_EMAIL و STUDENT_PASSWORD في البيئة.\n" +
        "مثال (PowerShell):\n" +
        '  $env:STUDENT_EMAIL="user@example.com"; $env:STUDENT_PASSWORD="..."; pnpm db:create-student',
    );
    process.exit(1);
  }

  const email = emailRaw.toLowerCase();
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`[create-student] تم إنشاء/تحديث طالب: ${email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
