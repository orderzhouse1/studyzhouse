import type { Request, Response } from "express";
import type { Course } from "@prisma/client";
import {
  CourseStatus,
  LessonStatus,
  Prisma,
  PricingType,
  UserRole,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { assertCanManageCourse } from "../lib/courseAccess.js";
import {
  mapCourseAdmin,
  mapCoursePublic,
} from "../lib/courseMapper.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { slugFromTitle } from "../lib/slug.js";
import { writeAuditLog } from "../services/audit.service.js";
import { enforcePublishReadinessForAdminCourse } from "../services/coursePublishGuard.service.js";
import type {
  CourseCreateBody,
  CourseUpdateBody,
} from "@studyhouse/shared";
import {
  adminCoursesQuerySchema,
  publicCoursesQuerySchema,
} from "@studyhouse/shared";

/** حالة الكورس بعد تطبيق حقول التحديث — للتحقق من الجاهزية عند النشر عبر PATCH */
function previewCourseAfterUpdate(
  existing: Course,
  body: CourseUpdateBody,
  nextStatus: CourseStatus,
): Course {
  return {
    ...existing,
    title: body.title !== undefined ? body.title.trim() : existing.title,
    description:
      body.description !== undefined
        ? body.description.trim()
        : existing.description,
    categoryId:
      body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    status: nextStatus,
  };
}

async function uniqueCourseSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.course.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
}

async function assertCategoryAssignable(categoryId: string | null): Promise<void> {
  if (!categoryId) return;
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, archivedAt: null },
  });
  if (!cat) {
    throw new AppError("VALIDATION_ERROR", "التصنيف غير متاح أو مؤرشف.", 400);
  }
}

function priceFromBody(
  pricingType: PricingType,
  priceAmount: number | undefined,
): Prisma.Decimal | null {
  if (pricingType === PricingType.FREE) return null;
  if (priceAmount === undefined || Number.isNaN(priceAmount)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "المبلغ مطلوب للكورسات المدفوعة.",
      400,
    );
  }
  return new Prisma.Decimal(String(priceAmount));
}

export async function listCoursesPublic(
  req: Request,
  res: Response,
): Promise<void> {
  const query = publicCoursesQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );
  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.CourseWhereInput = {
    status: CourseStatus.PUBLISHED,
  };

  if (query.categorySlug) {
    const categoryRow = await prisma.category.findFirst({
      where: { slug: query.categorySlug, archivedAt: null },
      select: { id: true },
    });
    if (!categoryRow) {
      res.status(200).json({
        success: true,
        data: { items: [] },
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
        },
      });
      return;
    }
    where.categoryId = categoryRow.id;
  }

  if (query.search?.trim()) {
    const s = query.search.trim();
    where.AND = [
      {
        OR: [
          { title: { contains: s, mode: "insensitive" } },
          { description: { contains: s, mode: "insensitive" } },
          { subtitle: { contains: s, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (query.pricingType) {
    where.pricingType = query.pricingType;
  }

  const orderBy: Prisma.CourseOrderByWithRelationInput[] = (() => {
    switch (query.sort) {
      case "price_asc":
        return [{ price: "asc" }, { publishedAt: "desc" }];
      case "price_desc":
        return [{ price: "desc" }, { publishedAt: "desc" }];
      case "title_asc":
        return [{ title: "asc" }];
      case "newest":
      default:
        return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    }
  })();

  const [total, rows] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            lessons: { where: { status: LessonStatus.PUBLISHED } },
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((row) => {
        const { _count, ...course } = row;
        return mapCoursePublic({
          ...course,
          lessonCount: _count.lessons,
        });
      }),
    },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function getCourseBySlugPublic(
  req: Request,
  res: Response,
): Promise<void> {
  const slug = String(
    req.validatedParams
      ? (req.validatedParams as { slug: string }).slug
      : req.params.slug,
  );

  const course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    include: {
      category: true,
      _count: { select: { lessons: { where: { status: "PUBLISHED" } } } },
    },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  const { _count, ...rest } = course;
  const dto = mapCoursePublic({
    ...rest,
    lessonCount: _count.lessons,
  });

  res.status(200).json({ success: true, data: { course: dto } });
}

export async function listCoursesAdmin(req: Request, res: Response): Promise<void> {
  const query = adminCoursesQuerySchema.parse(req.validatedQuery ?? req.query);
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.CourseWhereInput = {};
  if (auth.role === UserRole.ADMIN) {
    where.createdById = auth.userId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.pricingType) {
    where.pricingType = query.pricingType;
  }
  if (query.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { title: { contains: s, mode: "insensitive" } },
      { slug: { contains: s, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: {
        category: true,
        _count: { select: { lessons: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((row) => {
        const { _count, ...course } = row;
        return mapCourseAdmin({
          ...course,
          lessonCount: _count.lessons,
        });
      }),
    },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function createCourseAdmin(req: Request, res: Response): Promise<void> {
  const body = req.body as CourseCreateBody;
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  await assertCategoryAssignable(body.categoryId ?? null);

  const baseSlug = body.slug?.trim()
    ? body.slug.trim()
    : slugFromTitle(body.title);
  const slug = await uniqueCourseSlug(baseSlug);

  const thumb =
    body.thumbnailUrl && body.thumbnailUrl.length > 0
      ? body.thumbnailUrl
      : null;

  const price = priceFromBody(body.pricingType, body.priceAmount);

  const created = await prisma.course.create({
    data: {
      title: body.title.trim(),
      slug,
      subtitle: body.shortDescription?.trim() ?? null,
      description: body.description.trim(),
      coverImageUrl: thumb,
      pricingType: body.pricingType,
      price,
      currency: body.currency ?? "JOD",
      level: body.level,
      estimatedDurationMinutes: body.estimatedDurationMinutes ?? null,
      status: body.status,
      categoryId: body.categoryId ?? null,
      createdById: auth.userId,
      publishedAt:
        body.status === CourseStatus.PUBLISHED ? new Date() : null,
    },
    include: { category: true },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "COURSE_CREATE",
    entityType: "Course",
    entityId: created.id,
    metadata: { slug: created.slug },
    req,
  });

  const lessonCount = await prisma.lesson.count({
    where: { courseId: created.id },
  });

  res.status(201).json({
    success: true,
    data: { course: mapCourseAdmin({ ...created, lessonCount }) },
  });
}

export async function getCourseAdmin(req: Request, res: Response): Promise<void> {
  const id = String(
    req.validatedParams
      ? (req.validatedParams as { id: string }).id
      : req.params.id,
  );
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  assertCanManageCourse(req, course);

  const lessonCount = await prisma.lesson.count({ where: { courseId: course.id } });

  res.status(200).json({
    success: true,
    data: { course: mapCourseAdmin({ ...course, lessonCount }) },
  });
}

export async function updateCourseAdmin(req: Request, res: Response): Promise<void> {
  const id = String(
    req.validatedParams
      ? (req.validatedParams as { id: string }).id
      : req.params.id,
  );
  const body = req.body as CourseUpdateBody;
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.course.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  assertCanManageCourse(req, existing);

  if (body.categoryId !== undefined && body.categoryId !== null) {
    await assertCategoryAssignable(body.categoryId);
  }

  let slug = existing.slug;
  if (body.slug?.trim()) {
    slug = await uniqueCourseSlug(body.slug.trim(), existing.id);
  }

  const nextPricing = body.pricingType ?? existing.pricingType;

  let nextPrice: Prisma.Decimal | null;
  if (nextPricing === PricingType.FREE) {
    nextPrice = null;
  } else if (body.priceAmount !== undefined && body.priceAmount !== null) {
    nextPrice = new Prisma.Decimal(String(body.priceAmount));
  } else if (existing.price) {
    nextPrice = existing.price;
  } else {
    throw new AppError(
      "VALIDATION_ERROR",
      "المبلغ مطلوب للكورسات المدفوعة.",
      400,
    );
  }

  const nextStatus = body.status ?? existing.status;

  const becomingPublished =
    nextStatus === CourseStatus.PUBLISHED &&
    existing.status !== CourseStatus.PUBLISHED;

  if (becomingPublished) {
    await enforcePublishReadinessForAdminCourse({
      course: previewCourseAfterUpdate(existing as Course, body, nextStatus),
      actorId: auth.userId,
      req,
    });
  }

  let publishedAt = existing.publishedAt;
  if (nextStatus === CourseStatus.PUBLISHED && !publishedAt) {
    publishedAt = new Date();
  }

  const thumb =
    body.thumbnailUrl === undefined
      ? undefined
      : body.thumbnailUrl && body.thumbnailUrl.length > 0
        ? body.thumbnailUrl
        : null;

  const updated = await prisma.course.update({
    where: { id: existing.id },
    data: {
      title: body.title?.trim() ?? undefined,
      slug,
      subtitle:
        body.shortDescription === undefined
          ? undefined
          : body.shortDescription?.trim() ?? null,
      description: body.description?.trim() ?? undefined,
      coverImageUrl: thumb,
      pricingType: body.pricingType ?? undefined,
      price: nextPrice,
      currency: body.currency ?? undefined,
      level: body.level ?? undefined,
      estimatedDurationMinutes:
        body.estimatedDurationMinutes === undefined
          ? undefined
          : body.estimatedDurationMinutes,
      status: body.status ?? undefined,
      categoryId:
        body.categoryId === undefined ? undefined : body.categoryId,
      publishedAt,
    },
    include: { category: true },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "COURSE_UPDATE",
    entityType: "Course",
    entityId: updated.id,
    metadata: {},
    req,
  });

  const lessonCount = await prisma.lesson.count({ where: { courseId: updated.id } });

  res.status(200).json({
    success: true,
    data: { course: mapCourseAdmin({ ...updated, lessonCount }) },
  });
}

export async function publishCourseAdmin(req: Request, res: Response): Promise<void> {
  const id = String(
    req.validatedParams
      ? (req.validatedParams as { id: string }).id
      : req.params.id,
  );
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  assertCanManageCourse(req, existing);

  await enforcePublishReadinessForAdminCourse({
    course: existing,
    actorId: auth.userId,
    req,
  });

  await prisma.lesson.updateMany({
    where: { courseId: id, status: LessonStatus.DRAFT },
    data: { status: LessonStatus.PUBLISHED },
  });

  const updated = await prisma.course.update({
    where: { id },
    data: {
      status: CourseStatus.PUBLISHED,
      publishedAt: existing.publishedAt ?? new Date(),
    },
    include: { category: true },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "COURSE_PUBLISH",
    entityType: "Course",
    entityId: updated.id,
    metadata: {},
    req,
  });

  const lessonCount = await prisma.lesson.count({ where: { courseId: updated.id } });

  res.status(200).json({
    success: true,
    data: { course: mapCourseAdmin({ ...updated, lessonCount }) },
  });
}

export async function archiveCourseAdmin(req: Request, res: Response): Promise<void> {
  const id = String(
    req.validatedParams
      ? (req.validatedParams as { id: string }).id
      : req.params.id,
  );
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  assertCanManageCourse(req, existing);

  const updated = await prisma.course.update({
    where: { id },
    data: { status: CourseStatus.ARCHIVED },
    include: { category: true },
  });

  await writeAuditLog({
    actorId: auth.userId,
    action: "COURSE_ARCHIVE",
    entityType: "Course",
    entityId: updated.id,
    metadata: {},
    req,
  });

  const lessonCount = await prisma.lesson.count({ where: { courseId: updated.id } });

  res.status(200).json({
    success: true,
    data: { course: mapCourseAdmin({ ...updated, lessonCount }) },
  });
}
