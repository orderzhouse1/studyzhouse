import type { Request, Response } from "express";
import {
  ActivationCodeStatus,
  CourseStatus,
  Prisma,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import {
  generateActivationPlain,
  hashActivationCode,
  maskPrefixFromPlain,
  normalizeActivationCode,
} from "../lib/activationCodeCrypto.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import type {
  AdminActivationCodeCreateBody,
  AdminActivationCodeUpdateBody,
  AdminActivationCodesQuery,
} from "@studyhouse/shared";
import { adminActivationCodesQuerySchema } from "@studyhouse/shared";

export async function listActivationCodesAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const query = adminActivationCodesQuerySchema.parse(
    req.validatedQuery ?? req.query,
  ) as AdminActivationCodesQuery;

  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.ActivationCodeWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.courseId) {
    where.courseId = query.courseId;
  }
  if (query.search?.trim()) {
    where.course = {
      title: {
        contains: query.search.trim(),
        mode: "insensitive",
      },
    };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.activationCode.count({ where }),
    prisma.activationCode.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            pricingType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((r) => ({
        id: r.id,
        maskedCode: r.codePrefix || "—",
        course: {
          id: r.course.id,
          title: r.course.title,
          slug: r.course.slug,
          pricingType: r.course.pricingType,
          status: r.course.status,
        },
        status: r.status,
        usageLimit: r.maxUses,
        usedCount: r.usedCount,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function createActivationCodesAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as AdminActivationCodeCreateBody;
  const actorId = req.auth?.userId;
  if (!actorId) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const course = await prisma.course.findFirst({
    where: { id: body.courseId, status: CourseStatus.PUBLISHED },
    select: {
      id: true,
      title: true,
      slug: true,
      pricingType: true,
    },
  });

  if (!course) {
    throw new AppError(
      "NOT_FOUND",
      "الكورس غير موجود أو غير منشور.",
      404,
    );
  }

  const count = body.count ?? 1;
  const expiresAt =
    body.expiresAt !== undefined ? new Date(body.expiresAt) : undefined;

  const created: Array<{ id: string; plainCode: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < count; i++) {
      let plain = generateActivationPlain();
      let normalized = normalizeActivationCode(plain);
      let hash = hashActivationCode(normalized);
      let attempts = 0;
      while (
        attempts < 8 &&
        (await tx.activationCode.findUnique({ where: { codeHash: hash } }))
      ) {
        plain = generateActivationPlain();
        normalized = normalizeActivationCode(plain);
        hash = hashActivationCode(normalized);
        attempts++;
      }
      if (attempts >= 8) {
        throw new AppError(
          "INTERNAL_ERROR",
          "تعذّر توليد كود فريد، أعد المحاولة.",
          500,
        );
      }

      const prefix = maskPrefixFromPlain(plain);
      const row = await tx.activationCode.create({
        data: {
          codeHash: hash,
          codePrefix: prefix,
          courseId: course.id,
          status: ActivationCodeStatus.ACTIVE,
          maxUses: body.usageLimit,
          usedCount: 0,
          expiresAt,
          createdById: actorId,
          notes: body.note?.trim() || null,
        },
      });

      created.push({ id: row.id, plainCode: plain });
    }
  });

  await writeAuditLog({
    actorId,
    action: "ACTIVATION_CODE_CREATED",
    entityType: "ActivationCode",
    entityId: created[0]?.id ?? null,
    metadata: {
      courseId: course.id,
      usageLimit: body.usageLimit,
      codesCreated: count,
      ids: created.map((c) => c.id),
    },
    req,
  });

  res.status(201).json({
    success: true,
    data: {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        pricingType: course.pricingType,
      },
      codes: created.map((c) => ({
        id: c.id,
        code: c.plainCode,
      })),
    },
  });
}

export async function getActivationCodeAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const codeId = String((req.validatedParams as { codeId: string }).codeId);

  const row = await prisma.activationCode.findFirst({
    where: { id: codeId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          pricingType: true,
          status: true,
        },
      },
    },
  });

  if (!row) {
    throw new AppError("NOT_FOUND", "كود التفعيل غير موجود.", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      id: row.id,
      maskedCode: row.codePrefix || "—",
      course: row.course,
      status: row.status,
      usageLimit: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function patchActivationCodeAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const codeId = String((req.validatedParams as { codeId: string }).codeId);
  const body = req.body as AdminActivationCodeUpdateBody;

  const existing = await prisma.activationCode.findFirst({
    where: { id: codeId },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "كود التفعيل غير موجود.", 404);
  }

  if (body.usageLimit !== undefined && body.usageLimit < existing.usedCount) {
    throw new AppError(
      "VALIDATION_ERROR",
      `حد الاستخدام لا يمكن أن يكون أقل من عدد الاستخدامات الحالي (${existing.usedCount}).`,
      400,
    );
  }

  const data: Prisma.ActivationCodeUpdateInput = {};
  if (body.usageLimit !== undefined) {
    data.maxUses = body.usageLimit;
  }
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt;
  }
  if (body.note !== undefined) {
    data.notes = body.note;
  }

  const row = await prisma.activationCode.update({
    where: { id: codeId },
    data,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          pricingType: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: {
      id: row.id,
      maskedCode: row.codePrefix,
      course: row.course,
      status: row.status,
      usageLimit: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      notes: row.notes,
    },
  });
}

export async function disableActivationCodeAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const codeId = String((req.validatedParams as { codeId: string }).codeId);
  const actorId = req.auth?.userId;
  if (!actorId) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.activationCode.findFirst({
    where: { id: codeId },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "كود التفعيل غير موجود.", 404);
  }
  if (existing.status !== ActivationCodeStatus.ACTIVE) {
    throw new AppError(
      "INVALID_STATE",
      "الكود غير نشط بالفعل.",
      400,
    );
  }

  const row = await prisma.activationCode.update({
    where: { id: codeId },
    data: { status: ActivationCodeStatus.DISABLED },
  });

  await writeAuditLog({
    actorId,
    action: "ACTIVATION_CODE_DISABLED",
    entityType: "ActivationCode",
    entityId: row.id,
    metadata: { courseId: row.courseId },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      id: row.id,
      status: row.status,
    },
  });
}
