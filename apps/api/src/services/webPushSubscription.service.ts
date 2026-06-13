import type { Request } from "express";

import type { WebPushSubscribeBody } from "@studyhouse/shared";

import { prisma } from "../lib/prisma.js";

export async function upsertWebPushSubscription(
  userId: string,
  body: WebPushSubscribeBody,
  req?: Request,
): Promise<{ subscriptionId: string }> {
  const userAgent = req?.headers["user-agent"] ?? null;
  const now = new Date();

  const row = await prisma.webPushSubscription.upsert({
    where: { endpoint: body.endpoint },
    create: {
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent,
      isActive: true,
      lastSeenAt: now,
    },
    update: {
      userId,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent,
      isActive: true,
      lastSeenAt: now,
    },
  });

  return { subscriptionId: row.id };
}

export async function deactivateWebPushSubscription(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const existing = await prisma.webPushSubscription.findFirst({
    where: { endpoint, userId },
  });
  if (!existing) return false;

  await prisma.webPushSubscription.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
  return true;
}

export async function listActiveSubscriptionsForUser(
  userId: string,
): Promise<
  Array<{ id: string; endpoint: string; p256dh: string; auth: string }>
> {
  return prisma.webPushSubscription.findMany({
    where: { userId, isActive: true },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
}

export async function deactivateSubscriptionByEndpoint(
  endpoint: string,
): Promise<void> {
  await prisma.webPushSubscription.updateMany({
    where: { endpoint, isActive: true },
    data: { isActive: false },
  });
}
