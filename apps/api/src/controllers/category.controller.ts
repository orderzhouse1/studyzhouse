import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { slugFromTitle } from "../lib/slug.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { writeAuditLog } from "../services/audit.service.js";
import type { CategoryCreateBody, CategoryUpdateBody } from "@studyhouse/shared";
import { publicCategoriesQuerySchema } from "@studyhouse/shared";

function mapCategory(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    archivedAt: c.archivedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function uniqueCategorySlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function listCategoriesPublic(
  req: Request,
  res: Response,
): Promise<void> {
  const query = publicCategoriesQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );
  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where = { archivedAt: null };

  const [total, rows] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: { items: rows.map(mapCategory) },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function createCategoryAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as CategoryCreateBody;
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const baseSlug = body.slug?.trim() ? body.slug.trim() : slugFromTitle(body.name);
  const slug = await uniqueCategorySlug(baseSlug);

  const created = await prisma.category.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() ?? null,
    },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "CATEGORY_CREATE",
    entityType: "Category",
    entityId: created.id,
    metadata: { slug: created.slug },
    req,
  });

  res.status(201).json({ success: true, data: { category: mapCategory(created) } });
}

export async function updateCategoryAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const params = z.object({ id: z.string().cuid() }).parse(req.validatedParams ?? req.params);
  const body = req.body as CategoryUpdateBody;
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "التصنيف غير موجود.", 404);
  }

  let nextSlug = existing.slug;
  if (body.slug?.trim()) {
    nextSlug = await uniqueCategorySlug(body.slug.trim(), existing.id);
  }

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: body.name?.trim() ?? undefined,
      slug: nextSlug,
      description:
        body.description === undefined ? undefined : body.description?.trim() ?? null,
    },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "CATEGORY_UPDATE",
    entityType: "Category",
    entityId: updated.id,
    metadata: {},
    req,
  });

  res.status(200).json({ success: true, data: { category: mapCategory(updated) } });
}

export async function archiveCategoryAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const params = z.object({ id: z.string().cuid() }).parse(req.validatedParams ?? req.params);
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "التصنيف غير موجود.", 404);
  }

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: { archivedAt: new Date() },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "CATEGORY_ARCHIVE",
    entityType: "Category",
    entityId: updated.id,
    metadata: {},
    req,
  });

  res.status(200).json({ success: true, data: { category: mapCategory(updated) } });
}
