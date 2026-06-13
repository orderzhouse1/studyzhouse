import {
  applyIntegrationProcessEnv,
  ensureIntegrationDatabaseReady,
  hasIntegrationTestDatabase,
} from "./integrationEnv.js";

export default async function integrationGlobalSetup(): Promise<void> {
  if (!hasIntegrationTestDatabase()) {
    console.info(
      "[integration] TEST_DATABASE_URL not set — integration suites will be skipped.",
    );
    return;
  }

  applyIntegrationProcessEnv();
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await ensureIntegrationDatabaseReady(prisma);
    console.info("[integration] Test database is reachable.");
  } finally {
    await prisma.$disconnect();
  }
}
