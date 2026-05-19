import { randomBytes } from "node:crypto";

import type { Request, Response } from "express";
import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonStatus,
  Prisma,
  UserRole,
  UserStatus,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { mapCoursePublic } from "../lib/courseMapper.js";
import { hashPassword } from "../lib/password.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import { getStudentProfileSummaryForAdmin } from "../services/studentProfile.service.js";
import type {
  AdminEnrollmentCreateBody,
  AdminStudentCreateBody,
  AdminStudentUpdateBody,
} from "@studyhouse/shared";
import { adminStudentsQuerySchema } from "@studyhouse/shared";

function mapStudentSafe(u: {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    status: u.status,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}

export async function listStudentsAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const query = adminStudentsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );

  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.UserWhereInput = {
    role: UserRole.STUDENT,
    ...(query.search?.trim()
      ? {
          OR: [
            {
              fullName: {
                contains: query.search.trim(),
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query.search.trim(),
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: { progressPercent: true },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const items = rows.map((r) => {
    const active = r.enrollments;
    const avgProgress =
      active.length === 0
        ? 0
        : Math.round(
            active.reduce((s, e) => s + e.progressPercent, 0) /
              active.length,
          );
    return {
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      enrollmentsCount: r._count.enrollments,
      averageProgressPercent: avgProgress,
    };
  });

  res.status(200).json({
    success: true,
    data: { items },
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  });
}

export async function createStudentAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as AdminStudentCreateBody;
  const actorId = req.auth?.userId;

  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (existing) {
    throw new AppError(
      "DUPLICATE_EMAIL",
      "البريد الإلكتروني مستخدم مسبقًا.",
      409,
    );
  }

  let plainPassword =
    typeof body.password === "string" ? body.password.trim() : "";
  let generatedPassword: string | undefined;
  if (!plainPassword || plainPassword.length < 8) {
    plainPassword = randomBytes(12).toString("base64url");
    generatedPassword = plainPassword;
  }

  const passwordHash = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash,
      role: UserRole.STUDENT,
      status: body.status ?? UserStatus.ACTIVE,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      student: mapStudentSafe({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      }),
      ...(generatedPassword
        ? { generatedPassword }
        : {}),
    },
  });
}

async function loadStudentOrThrow(studentId: string) {
  const user = await prisma.user.findFirst({
    where: { id: studentId, role: UserRole.STUDENT },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user) {
    throw new AppError("NOT_FOUND", "الطالب غير موجود.", 404);
  }
  return user;
}

export async function getStudentAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = String(
    (req.validatedParams as { studentId: string }).studentId,
  );
  const user = await loadStudentOrThrow(studentId);

  const enrollmentsRaw = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      course: { include: { category: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const enrollments = await Promise.all(
    enrollmentsRaw.map(async (e) => {
      const totalLessons = await prisma.lesson.count({
        where: {
          courseId: e.courseId,
          status: LessonStatus.PUBLISHED,
        },
      });
      const completedLessons = await prisma.lessonProgress.count({
        where: {
          enrollmentId: e.id,
          isCompleted: true,
        },
      });
      const lastProg = await prisma.lessonProgress.findFirst({
        where: { enrollmentId: e.id },
        orderBy: { lastWatchedAt: "desc" },
      });

      const courseDto = mapCoursePublic({
        ...e.course,
        lessonCount: totalLessons,
      });

      return {
        id: e.id,
        status: e.status,
        source: e.source,
        progressPercent: e.progressPercent,
        completedLessons,
        totalLessons,
        startedAt: e.startedAt?.toISOString() ?? null,
        completedAt: e.completedAt?.toISOString() ?? null,
        lastActivityAt: lastProg?.lastWatchedAt?.toISOString() ?? null,
        course: {
          id: courseDto.id,
          title: courseDto.title,
          slug: courseDto.slug,
          thumbnailUrl: courseDto.thumbnailUrl,
          pricingType: courseDto.pricingType,
          category: courseDto.category,
        },
      };
    }),
  );

  const activeCourseIds = enrollmentsRaw
    .filter((e) => e.status === EnrollmentStatus.ACTIVE)
    .map((e) => e.courseId);

  const publishedCourses = await prisma.course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
      ...(activeCourseIds.length
        ? { id: { notIn: activeCourseIds } }
        : {}),
    },
    include: { category: true },
    orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
    take: 200,
  });

  const availableCourses = publishedCourses.map((c) => {
    const dto = mapCoursePublic({
      ...c,
      lessonCount: 0,
    });
    return {
      id: dto.id,
      title: dto.title,
      slug: dto.slug,
      thumbnailUrl: dto.thumbnailUrl,
      pricingType: dto.pricingType,
      category: dto.category,
    };
  });

  const learningProfile = await getStudentProfileSummaryForAdmin(studentId);

  res.status(200).json({
    success: true,
    data: {
      student: mapStudentSafe(user),
      enrollments,
      availableCourses,
      learningProfile,
    },
  });
}

export async function patchStudentAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = String(
    (req.validatedParams as { studentId: string }).studentId,
  );
  const body = req.body as AdminStudentUpdateBody;
  const actorId = req.auth?.userId;

  const existing = await loadStudentOrThrow(studentId);

  const data: Prisma.UserUpdateInput = {};
  if (body.fullName !== undefined) {
    data.fullName = body.fullName.trim();
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.password !== undefined && body.password.trim().length >= 8) {
    data.passwordHash = await hashPassword(body.password.trim());
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data,
  });

  let auditAction = "STUDENT_UPDATED";
  if (body.status !== undefined && body.status !== existing.status) {
    if (user.status === UserStatus.SUSPENDED) {
      auditAction = "STUDENT_SUSPENDED_BY_ADMIN";
    } else if (
      user.status === UserStatus.ACTIVE &&
      existing.status !== UserStatus.ACTIVE
    ) {
      auditAction = "STUDENT_REACTIVATED_BY_ADMIN";
    }
  }

  await writeAuditLog({
    actorId,
    action: auditAction,
    entityType: "User",
    entityId: user.id,
    metadata: {
      fields: Object.keys(body),
      ...(body.status !== undefined && body.status !== existing.status
        ? { previousStatus: existing.status, newStatus: user.status }
        : {}),
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      student: mapStudentSafe({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      }),
    },
  });
}

export async function enrollStudentAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = String(
    (req.validatedParams as { studentId: string }).studentId,
  );
  const body = req.body as AdminEnrollmentCreateBody;
  const actorId = req.auth?.userId;

  await loadStudentOrThrow(studentId);

  const course = await prisma.course.findFirst({
    where: { id: body.courseId, status: CourseStatus.PUBLISHED },
  });
  if (!course) {
    throw new AppError(
      "NOT_FOUND",
      "الكورس غير موجود أو غير منشور.",
      404,
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId: course.id,
      },
    },
  });

  if (existing?.status === EnrollmentStatus.ACTIVE) {
    throw new AppError(
      "DUPLICATE_ENROLLMENT",
      "الطالب مسجّل بالفعل في هذا الكورس.",
      409,
    );
  }

  let enrollment;
  if (existing) {
    enrollment = await prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        status: EnrollmentStatus.ACTIVE,
        source: EnrollmentSource.MANUAL_ADMIN,
        enrolledById: actorId ?? null,
        startedAt: existing.startedAt ?? new Date(),
        completedAt: null,
      },
    });
  } else {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId: course.id,
        source: EnrollmentSource.MANUAL_ADMIN,
        status: EnrollmentStatus.ACTIVE,
        enrolledById: actorId ?? null,
        startedAt: new Date(),
      },
    });
  }

  await writeAuditLog({
    actorId,
    action: "STUDENT_ENROLLED_BY_ADMIN",
    entityType: "Enrollment",
    entityId: enrollment.id,
    metadata: {
      studentId,
      courseId: course.id,
      courseTitle: course.title,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        status: enrollment.status,
        source: enrollment.source,
      },
    },
  });
}

export async function revokeStudentEnrollmentAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = String(
    (req.validatedParams as { studentId: string }).studentId,
  );
  const enrollmentId = String(
    (req.validatedParams as { enrollmentId: string }).enrollmentId,
  );
  const actorId = req.auth?.userId;

  await loadStudentOrThrow(studentId);

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, studentId },
  });
  if (!enrollment) {
    throw new AppError("NOT_FOUND", "التسجيل غير موجود.", 404);
  }
  if (enrollment.status !== EnrollmentStatus.ACTIVE) {
    throw new AppError(
      "INVALID_STATE",
      "التسجيل غير نشط بالفعل.",
      400,
    );
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.REVOKED },
  });

  await writeAuditLog({
    actorId,
    action: "STUDENT_ENROLLMENT_REVOKED",
    entityType: "Enrollment",
    entityId: updated.id,
    metadata: {
      studentId,
      courseId: updated.courseId,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      enrollment: {
        id: updated.id,
        status: updated.status,
      },
    },
  });
}
