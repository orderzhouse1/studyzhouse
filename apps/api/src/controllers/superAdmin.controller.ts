import { randomBytes } from "node:crypto";

import type { Request, Response } from "express";
import {
  CourseStatus,
  EnrollmentStatus,
  PaymentRequestStatus,
  Prisma,
  UserRole,
  UserStatus,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { hashPassword } from "../lib/password.js";
import { prismaSkipTake } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import { writeAuditLog } from "../services/audit.service.js";
import type {
  SuperAdminAdminCreateBody,
  SuperAdminAdminPatchBody,
  SuperAdminAdminsQuery,
  SuperAdminAuditLogsQuery,
  SuperAdminSettingsPatchBody,
} from "@studyhouse/shared";
import {
  superAdminAdminsQuerySchema,
  superAdminAuditLogsQuerySchema,
} from "@studyhouse/shared";

/** مفتاح AppSetting: يضمّ اسم المنصة وتعليمات CliQ وغيرها — مصدر عرض تعليمات الدفع اليدوي في الواجهة، وليس متغيرات CLIQ_* في .env */
const PLATFORM_SETTINGS_KEY = "platform_governance";

type PlatformSettingsJson = {
  platformName: string;
  supportEmail: string;
  cliqAlias: string;
  cliqInstructions: string;
  allowStudentSignup: boolean;
  maintenanceMode: boolean;
};

const DEFAULT_SETTINGS: PlatformSettingsJson = {
  platformName: "Studyhouse",
  supportEmail: "",
  cliqAlias: "BATMAN0",
  cliqInstructions:
    "حوّل المبلغ إلى معرّف CliQ أعلاه، ثم أرسل طلب التفعيل مع رقم العملية أو صورة الإيصال.",
  allowStudentSignup: true,
  maintenanceMode: false,
};

const SENSITIVE_META_KEYS = new Set([
  "password",
  "passwordhash",
  "hash",
  "plaincode",
  "token",
  "secret",
  "pepper",
  "refreshtoken",
]);

function sanitizeMetadata(meta: unknown): unknown {
  if (meta === null || typeof meta !== "object") {
    return meta;
  }
  if (Array.isArray(meta)) {
    return meta.map((x) => sanitizeMetadata(x));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    const lk = k.toLowerCase();
    if (
      SENSITIVE_META_KEYS.has(lk) ||
      lk.includes("password") ||
      lk.includes("secret") ||
      lk.includes("hash")
    ) {
      out[k] = "[مخفي]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = sanitizeMetadata(v) as unknown;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function generateReadablePassword(length = 14): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = randomBytes(length * 2);
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars[buf[i]! % chars.length];
  }
  return s;
}

async function loadPlatformSettings(): Promise<PlatformSettingsJson> {
  const row = await prisma.appSetting.findUnique({
    where: { key: PLATFORM_SETTINGS_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== "object") {
    return { ...DEFAULT_SETTINGS };
  }
  const j = row.valueJson as Record<string, unknown>;
  return {
    platformName:
      typeof j.platformName === "string"
        ? j.platformName
        : DEFAULT_SETTINGS.platformName,
    supportEmail:
      typeof j.supportEmail === "string"
        ? j.supportEmail
        : DEFAULT_SETTINGS.supportEmail,
    cliqAlias:
      typeof j.cliqAlias === "string" && j.cliqAlias.trim()
        ? j.cliqAlias.trim()
        : DEFAULT_SETTINGS.cliqAlias,
    cliqInstructions:
      typeof j.cliqInstructions === "string" && j.cliqInstructions.trim()
        ? j.cliqInstructions.trim()
        : DEFAULT_SETTINGS.cliqInstructions,
    allowStudentSignup:
      typeof j.allowStudentSignup === "boolean"
        ? j.allowStudentSignup
        : DEFAULT_SETTINGS.allowStudentSignup,
    maintenanceMode:
      typeof j.maintenanceMode === "boolean"
        ? j.maintenanceMode
        : DEFAULT_SETTINGS.maintenanceMode,
  };
}

async function assertAdminManageableTarget(adminId: string): Promise<{
  id: string;
  role: UserRole;
  status: UserStatus;
}> {
  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, status: true },
  });
  if (!user) {
    throw new AppError("NOT_FOUND", "المستخدم غير موجود.", 404);
  }
  if (user.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "لا يمكن إدارة هذا الحساب من شاشة الأدمنز.",
      403,
    );
  }
  return user;
}

export async function getSuperAdminOverview(
  _req: Request,
  res: Response,
): Promise<void> {
  const [
    totalStudents,
    totalAdmins,
    totalCourses,
    publishedCourses,
    draftCourses,
    activeEnrollments,
    activationRedemptionsCount,
    pendingPaymentRequests,
    approvedPaymentRequests,
    rejectedPaymentRequests,
    recentAuditRows,
    recentPaymentRows,
    recentStudentRows,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    prisma.course.count({ where: { status: CourseStatus.DRAFT } }),
    prisma.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
    prisma.codeRedemption.count(),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.PENDING },
    }),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.APPROVED },
    }),
    prisma.paymentRequest.count({
      where: { status: PaymentRequestStatus.REJECTED },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    }),
    prisma.paymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        student: {
          select: { id: true, fullName: true, email: true },
        },
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.STUDENT },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        totalAdmins,
        totalCourses,
        publishedCourses,
        draftCourses,
        activeEnrollments,
        activationRedemptionsCount,
        pendingPaymentRequests,
        approvedPaymentRequests,
        rejectedPaymentRequests,
      },
      recentAuditLogs: recentAuditRows.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: sanitizeMetadata(a.metadataJson),
        createdAt: a.createdAt.toISOString(),
        actor: a.actor
          ? {
              id: a.actor.id,
              fullName: a.actor.fullName,
              email: a.actor.email,
            }
          : null,
      })),
      recentPaymentRequests: recentPaymentRows.map((p) => ({
        id: p.id,
        status: p.status,
        paidAmount: p.amount.toString(),
        currency: p.currency,
        paymentReference: p.transactionReference,
        createdAt: p.createdAt.toISOString(),
        student: p.student,
        course: { title: p.course.title, slug: p.course.slug },
      })),
      recentStudents: recentStudentRows.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    },
  });
}

export async function listSuperAdminAdmins(
  req: Request,
  res: Response,
): Promise<void> {
  const query = superAdminAdminsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  ) as SuperAdminAdminsQuery;
  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.UserWhereInput = {
    role: UserRole.ADMIN,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search?.trim()) {
    const s = query.search.trim();
    where.AND = [
      {
        OR: [
          { email: { contains: s, mode: "insensitive" } },
          { fullName: { contains: s, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: rows.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
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

export async function createSuperAdminAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const body = req.body as SuperAdminAdminCreateBody;

  const emailNorm = body.email.toLowerCase().trim();

  const dup = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (dup) {
    throw new AppError(
      "EMAIL_EXISTS",
      "البريد مستخدم بالفعل.",
      409,
    );
  }

  let plainPassword: string;
  let generated = false;
  if (body.password !== undefined) {
    plainPassword = body.password;
  } else {
    plainPassword = generateReadablePassword(16);
    generated = true;
  }

  const passwordHash = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      fullName: body.fullName.trim(),
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          jobTitle: null,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  await writeAuditLog({
    actorId,
    action: "ADMIN_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
    req,
  });

  res.status(201).json({
    success: true,
    data: {
      admin: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
      generatedPassword: generated ? plainPassword : null,
    },
  });
}

export async function getSuperAdminAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const adminId = String(
    (req.validatedParams as { adminId: string }).adminId,
  );

  const user = await prisma.user.findFirst({
    where: { id: adminId, role: UserRole.ADMIN },
    include: {
      adminProfile: true,
    },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "الأدمن غير موجود.", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        jobTitle: user.adminProfile?.jobTitle ?? null,
      },
    },
  });
}

export async function patchSuperAdminAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const adminId = String(
    (req.validatedParams as { adminId: string }).adminId,
  );
  const body = req.body as SuperAdminAdminPatchBody;

  await assertAdminManageableTarget(adminId);

  const data: Prisma.UserUpdateInput = {};
  if (body.fullName !== undefined) {
    data.fullName = body.fullName.trim();
  }
  if (body.status !== undefined) {
    data.status = body.status;
  }
  if (body.newPassword !== undefined) {
    data.passwordHash = await hashPassword(body.newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: adminId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      updatedAt: true,
    },
  });

  await writeAuditLog({
    actorId,
    action: "ADMIN_UPDATED",
    entityType: "User",
    entityId: adminId,
    metadata: {
      fields: Object.keys(body).filter((k) => k !== "newPassword"),
      passwordReset: Boolean(body.newPassword),
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      admin: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    },
  });
}

export async function disableSuperAdminAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const adminId = String(
    (req.validatedParams as { adminId: string }).adminId,
  );

  if (adminId === actorId) {
    throw new AppError(
      "FORBIDDEN",
      "لا يمكنك تعطيل حسابك بنفسك.",
      403,
    );
  }

  await assertAdminManageableTarget(adminId);

  await prisma.user.update({
    where: { id: adminId },
    data: { status: UserStatus.SUSPENDED },
  });

  await writeAuditLog({
    actorId,
    action: "ADMIN_DISABLED",
    entityType: "User",
    entityId: adminId,
    req,
  });

  res.status(200).json({
    success: true,
    data: { adminId, status: UserStatus.SUSPENDED },
  });
}

export async function enableSuperAdminAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const adminId = String(
    (req.validatedParams as { adminId: string }).adminId,
  );

  await assertAdminManageableTarget(adminId);

  await prisma.user.update({
    where: { id: adminId },
    data: { status: UserStatus.ACTIVE },
  });

  await writeAuditLog({
    actorId,
    action: "ADMIN_ENABLED",
    entityType: "User",
    entityId: adminId,
    req,
  });

  res.status(200).json({
    success: true,
    data: { adminId, status: UserStatus.ACTIVE },
  });
}

export async function listSuperAdminAuditLogs(
  req: Request,
  res: Response,
): Promise<void> {
  const query = superAdminAuditLogsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  ) as SuperAdminAuditLogsQuery;
  const { skip, take } = prismaSkipTake(query.page, query.pageSize);

  const where: Prisma.AuditLogWhereInput = {};

  if (query.actorId) {
    where.actorId = query.actorId;
  }
  if (query.action?.trim()) {
    where.action = {
      contains: query.action.trim(),
      mode: "insensitive",
    };
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) {
      where.createdAt.gte = query.from;
    }
    if (query.to) {
      where.createdAt.lte = query.to;
    }
  }

  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
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
      items: rows.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: sanitizeMetadata(a.metadataJson),
        createdAt: a.createdAt.toISOString(),
        actor: a.actor
          ? {
              id: a.actor.id,
              fullName: a.actor.fullName,
              email: a.actor.email,
            }
          : null,
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

export async function getSuperAdminSettings(
  _req: Request,
  res: Response,
): Promise<void> {
  const settings = await loadPlatformSettings();
  res.status(200).json({
    success: true,
    data: { settings },
  });
}

export async function patchSuperAdminSettings(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const body = req.body as SuperAdminSettingsPatchBody;

  const current = await loadPlatformSettings();
  const next: PlatformSettingsJson = {
    ...current,
    ...(body.platformName !== undefined
      ? { platformName: body.platformName }
      : {}),
    ...(body.supportEmail !== undefined
      ? { supportEmail: body.supportEmail }
      : {}),
    ...(body.cliqAlias !== undefined ? { cliqAlias: body.cliqAlias } : {}),
    ...(body.cliqInstructions !== undefined
      ? { cliqInstructions: body.cliqInstructions }
      : {}),
    ...(body.allowStudentSignup !== undefined
      ? { allowStudentSignup: body.allowStudentSignup }
      : {}),
    ...(body.maintenanceMode !== undefined
      ? { maintenanceMode: body.maintenanceMode }
      : {}),
  };

  await prisma.appSetting.upsert({
    where: { key: PLATFORM_SETTINGS_KEY },
    create: {
      key: PLATFORM_SETTINGS_KEY,
      valueJson: next as Prisma.InputJsonValue,
    },
    update: {
      valueJson: next as Prisma.InputJsonValue,
    },
  });

  await writeAuditLog({
    actorId,
    action: "PLATFORM_SETTINGS_UPDATED",
    entityType: "AppSetting",
    entityId: PLATFORM_SETTINGS_KEY,
    metadata: { keys: Object.keys(body) },
    req,
  });

  res.status(200).json({
    success: true,
    data: { settings: next },
  });
}
