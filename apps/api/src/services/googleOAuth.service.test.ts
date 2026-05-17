import { UserRole, UserStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../lib/AppError.js";

const prismaMock = {
  oAuthAccount: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../lib/platformSettings.js", () => ({
  loadPlatformSettings: vi.fn().mockResolvedValue({ allowStudentSignup: true }),
}));
vi.mock("../lib/password.js", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-oauth-only"),
}));

describe("resolveGoogleAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
    );
  });

  it("creates STUDENT ACTIVE for new Google email", async () => {
    const { resolveGoogleAuthUser } = await import("./googleOAuth.service.js");

    prismaMock.oAuthAccount.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    prismaMock.oAuthAccount.create.mockResolvedValue({});

    const result = await resolveGoogleAuthUser({
      sub: "google-sub-1",
      email: "new@example.com",
      email_verified: true,
      name: "New Student",
    });

    expect(result.isNewUser).toBe(true);
    expect(result.role).toBe(UserRole.STUDENT);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          email: "new@example.com",
        }),
      }),
    );
  });

  it("blocks ADMIN email on link attempt", async () => {
    const { resolveGoogleAuthUser } = await import("./googleOAuth.service.js");

    prismaMock.oAuthAccount.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      avatarUrl: null,
    });

    await expect(
      resolveGoogleAuthUser({
        sub: "google-sub-2",
        email: "admin@example.com",
        email_verified: true,
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      resolveGoogleAuthUser({
        sub: "google-sub-2",
        email: "admin@example.com",
        email_verified: true,
      }),
    ).rejects.toMatchObject({ code: "GOOGLE_STAFF_NOT_ALLOWED" });
  });

  it("blocks SUSPENDED student", async () => {
    const { resolveGoogleAuthUser } = await import("./googleOAuth.service.js");

    prismaMock.oAuthAccount.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "stu-1",
      role: UserRole.STUDENT,
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date(),
      avatarUrl: null,
    });

    await expect(
      resolveGoogleAuthUser({
        sub: "google-sub-3",
        email: "student@example.com",
        email_verified: true,
      }),
    ).rejects.toMatchObject({ code: "ACCOUNT_NOT_ACTIVE" });
  });
});
