/**
 * إنشاء أو تحديث حساب ADMIN (كلمة المرور تُمرَّر عبر المتغيرات فقط).
 *
 *   ADMIN_EMAIL=omar@example.com ADMIN_PASSWORD='...' pnpm db:create-admin
 *   ADMIN_FULL_NAME='عمر' (اختياري)
 */
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const emailRaw = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || "مدير محتوى";

  if (!emailRaw || !password) {
    console.error(
      "حدّد ADMIN_EMAIL و ADMIN_PASSWORD في البيئة.\n" +
        "مثال (PowerShell):\n" +
        '  $env:ADMIN_EMAIL="user@example.com"; $env:ADMIN_PASSWORD="..."; pnpm db:create-admin',
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
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      jobTitle: "مدير محتوى",
    },
  });

  console.log(`[create-admin] تم إنشاء/تحديث مدير: ${email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
