/**
 * Maps paid published courses to App Store Connect Product IDs from
 * docs/app_store_connect_iap_products_setup.csv and sets iosPurchasable=true.
 *
 * Usage (repo root, DATABASE_URL set):
 *   pnpm exec tsx prisma/map-apple-iap-products-from-csv.ts
 *   pnpm exec tsx prisma/map-apple-iap-products-from-csv.ts --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

type CsvRow = {
  internalCourseId: string;
  slug: string;
  recommendedAppleProductId: string;
};

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0]!.split(",");
  const idIdx = header.indexOf("internalCourseId");
  const slugIdx = header.indexOf("slug");
  const productIdx = header.indexOf("recommendedAppleProductId");
  if (idIdx < 0 || slugIdx < 0 || productIdx < 0) {
    throw new Error("CSV missing required columns");
  }

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    // Simple CSV split that respects quoted fields.
    const cols: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        cols.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    cols.push(cur);

    const productId = (cols[productIdx] ?? "").trim();
    const internalCourseId = (cols[idIdx] ?? "").trim();
    const slug = (cols[slugIdx] ?? "").trim();
    if (!productId || !internalCourseId || !slug) continue;
    rows.push({ internalCourseId, slug, recommendedAppleProductId: productId });
  }
  return rows;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const csvPath = path.join(root, "docs/app_store_connect_iap_products_setup.csv");
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  if (rows.length === 0) throw new Error("No product rows found in CSV");

  const productIds = rows.map((r) => r.recommendedAppleProductId);
  if (new Set(productIds).size !== productIds.length) {
    throw new Error("Duplicate Product IDs in CSV");
  }

  const results: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const course = await prisma.course.findUnique({
      where: { id: row.internalCourseId },
      select: {
        id: true,
        slug: true,
        status: true,
        pricingType: true,
        appleProductId: true,
        iosPurchasable: true,
      },
    });

    if (!course) {
      results.push({ ...row, ok: false, error: "COURSE_NOT_FOUND" });
      continue;
    }
    if (course.slug !== row.slug) {
      results.push({
        ...row,
        ok: false,
        error: `SLUG_MISMATCH db=${course.slug}`,
      });
      continue;
    }
    if (course.pricingType !== "PAID" || course.status !== "PUBLISHED") {
      results.push({
        ...row,
        ok: false,
        error: `NOT_PAID_PUBLISHED status=${course.status} pricing=${course.pricingType}`,
      });
      continue;
    }

    const conflict = await prisma.course.findFirst({
      where: {
        appleProductId: row.recommendedAppleProductId,
        NOT: { id: course.id },
      },
      select: { id: true, slug: true },
    });
    if (conflict) {
      results.push({
        ...row,
        ok: false,
        error: `PRODUCT_ID_IN_USE_BY ${conflict.slug}`,
      });
      continue;
    }

    if (!dryRun) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          appleProductId: row.recommendedAppleProductId,
          iosPurchasable: true,
        },
      });
    }

    results.push({
      id: course.id,
      slug: course.slug,
      appleProductId: row.recommendedAppleProductId,
      iosPurchasable: true,
      ok: true,
      dryRun,
    });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ mapped: ok, failed: failed.length, results }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
