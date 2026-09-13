import type { MobilePushPlatform, MobilePushTokenRegisterBody } from "@studyhouse/shared";

import { prisma } from "../lib/prisma.js";

export async function upsertMobilePushToken(
  userId: string,
  body: MobilePushTokenRegisterBody,
): Promise<{ tokenId: string }> {
  const now = new Date();
  const row = await prisma.mobilePushToken.upsert({
    where: { token: body.token },
    create: {
      userId,
      token: body.token,
      platform: body.platform,
      deviceInfo: body.deviceInfo ?? null,
      isActive: true,
      lastSeenAt: now,
    },
    update: {
      userId,
      platform: body.platform,
      deviceInfo: body.deviceInfo ?? null,
      isActive: true,
      lastSeenAt: now,
    },
    select: { id: true },
  });
  return { tokenId: row.id };
}

export async function deactivateMobilePushToken(
  userId: string,
  token: string,
): Promise<boolean> {
  const existing = await prisma.mobilePushToken.findFirst({
    where: { token, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.mobilePushToken.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
  return true;
}

export async function deactivateMobilePushTokenByValue(
  token: string,
): Promise<void> {
  await prisma.mobilePushToken.updateMany({
    where: { token, isActive: true },
    data: { isActive: false },
  });
}

export async function listActiveMobilePushTokensForUser(
  userId: string,
  platform?: MobilePushPlatform,
): Promise<Array<{ id: string; token: string; platform: string }>> {
  return prisma.mobilePushToken.findMany({
    where: {
      userId,
      isActive: true,
      ...(platform ? { platform } : {}),
    },
    select: { id: true, token: true, platform: true },
  });
}
