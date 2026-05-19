import type { Prisma, StudentProfile } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type {
  StudentAccount,
  StudentInterestId,
  StudentLearningGoalId,
  StudentOnboardingCompleteBody,
  StudentProfileDto,
  StudentProfilePage,
  StudentProfilePatchBody,
} from "@studyhouse/shared";
import {
  STUDENT_INTEREST_IDS,
  STUDENT_LEARNING_GOAL_IDS,
} from "@studyhouse/shared";

const INTEREST_SET = new Set<string>(STUDENT_INTEREST_IDS);
const GOAL_SET = new Set<string>(STUDENT_LEARNING_GOAL_IDS);

function parseStringArray(
  value: Prisma.JsonValue | null | undefined,
  allowed: Set<string>,
): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || !allowed.has(trimmed)) continue;
    if (!out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}

export function mapStudentProfile(
  profile: StudentProfile | null,
): StudentProfileDto {
  const completed = profile?.onboardingCompletedAt ?? null;
  const skipped = profile?.onboardingSkippedAt ?? null;
  return {
    country: profile?.country ?? null,
    phone: profile?.phone ?? null,
    gender: profile?.gender ?? null,
    birthYear: profile?.birthYear ?? null,
    currentLevel: profile?.currentLevel ?? null,
    learningGoals: parseStringArray(
      profile?.learningGoals,
      GOAL_SET,
    ) as StudentLearningGoalId[],
    interests: parseStringArray(
      profile?.interests,
      INTEREST_SET,
    ) as StudentInterestId[],
    weeklyStudyTime: profile?.weeklyStudyTime ?? null,
    preferredLearningStyle: profile?.preferredLearningStyle ?? null,
    onboardingCompletedAt: completed?.toISOString() ?? null,
    onboardingSkippedAt: skipped?.toISOString() ?? null,
    needsOnboarding: !completed && !skipped,
  };
}

type ProfileBody = StudentProfilePatchBody | StudentOnboardingCompleteBody;

function buildProfileFieldValues(body: ProfileBody): {
  country?: string | null;
  phone?: string | null;
  gender?: ProfileBody["gender"] | null;
  birthYear?: number | null;
  currentLevel?: ProfileBody["currentLevel"] | null;
  learningGoals?: ProfileBody["learningGoals"];
  interests?: ProfileBody["interests"];
  weeklyStudyTime?: ProfileBody["weeklyStudyTime"] | null;
  preferredLearningStyle?: ProfileBody["preferredLearningStyle"] | null;
} {
  const data: ReturnType<typeof buildProfileFieldValues> = {};

  if (body.country !== undefined) {
    data.country = body.country ?? null;
  }
  if (body.phone !== undefined) {
    data.phone = body.phone ?? null;
  }
  if (body.gender !== undefined) {
    data.gender = body.gender ?? null;
  }
  if (body.birthYear !== undefined) {
    data.birthYear = body.birthYear ?? null;
  }
  if (body.currentLevel !== undefined) {
    data.currentLevel = body.currentLevel ?? null;
  }
  if (body.learningGoals !== undefined) {
    data.learningGoals = body.learningGoals;
  }
  if (body.interests !== undefined) {
    data.interests = body.interests;
  }
  if (body.weeklyStudyTime !== undefined) {
    data.weeklyStudyTime = body.weeklyStudyTime ?? null;
  }
  if (body.preferredLearningStyle !== undefined) {
    data.preferredLearningStyle = body.preferredLearningStyle ?? null;
  }

  return data;
}

async function loadStudentAccount(userId: string): Promise<StudentAccount> {
  const [user, googleCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, status: true },
    }),
    prisma.oAuthAccount.count({ where: { userId } }),
  ]);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return {
    fullName: user.fullName,
    email: user.email,
    status: user.status,
    hasGoogleLogin: googleCount > 0,
  };
}

export async function getStudentProfileForUser(
  userId: string,
): Promise<StudentProfileDto> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  return mapStudentProfile(profile);
}

export async function getStudentProfilePageForUser(
  userId: string,
): Promise<StudentProfilePage> {
  const [account, profile] = await Promise.all([
    loadStudentAccount(userId),
    getStudentProfileForUser(userId),
  ]);
  return { account, profile };
}

export async function patchStudentProfileForUser(
  userId: string,
  body: StudentProfilePatchBody,
): Promise<StudentProfilePage> {
  const { fullName, ...profileBody } = body;

  if (fullName !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { fullName: fullName.trim() },
    });
  }

  const fields = buildProfileFieldValues(profileBody);
  if (Object.keys(fields).length > 0) {
    await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, ...fields },
      update: fields,
    });
  }

  return getStudentProfilePageForUser(userId);
}

export async function completeStudentOnboarding(
  userId: string,
  body: StudentOnboardingCompleteBody,
): Promise<StudentProfileDto> {
  const fields = buildProfileFieldValues(body);
  const now = new Date();
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...fields,
      onboardingCompletedAt: now,
      onboardingSkippedAt: null,
    },
    update: {
      ...fields,
      onboardingCompletedAt: now,
      onboardingSkippedAt: null,
    },
  });
  return mapStudentProfile(profile);
}

export async function skipStudentOnboarding(
  userId: string,
): Promise<StudentProfileDto> {
  const now = new Date();
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      onboardingSkippedAt: now,
    },
    update: {
      onboardingSkippedAt: now,
    },
  });
  return mapStudentProfile(profile);
}

export async function getStudentProfileSummaryForAdmin(
  userId: string,
): Promise<StudentProfileDto | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;
  return mapStudentProfile(profile);
}
