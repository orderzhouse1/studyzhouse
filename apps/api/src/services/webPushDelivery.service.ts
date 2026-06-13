import {
  ensureWebPushVapid,
  isWebPushConfigured,
  webpush,
} from "./webPushConfig.service.js";
import {
  deactivateSubscriptionByEndpoint,
  listActiveSubscriptionsForUser,
} from "./webPushSubscription.service.js";

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string | null;
};

export type WebPushDeliveryStats = {
  webPushSent: number;
  webPushFailed: number;
  inactiveSubscriptionsDisabled: number;
};

function emptyStats(): WebPushDeliveryStats {
  return {
    webPushSent: 0,
    webPushFailed: 0,
    inactiveSubscriptionsDisabled: 0,
  };
}

function mergeStats(
  a: WebPushDeliveryStats,
  b: WebPushDeliveryStats,
): WebPushDeliveryStats {
  return {
    webPushSent: a.webPushSent + b.webPushSent,
    webPushFailed: a.webPushFailed + b.webPushFailed,
    inactiveSubscriptionsDisabled:
      a.inactiveSubscriptionsDisabled + b.inactiveSubscriptionsDisabled,
  };
}

function isExpiredSubscriptionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const statusCode = (err as { statusCode?: number }).statusCode;
  return statusCode === 404 || statusCode === 410;
}

async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: WebPushPayload,
): Promise<"sent" | "failed" | "disabled"> {
  if (!ensureWebPushVapid()) return "failed";

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? null,
      }),
    );
    return "sent";
  } catch (err) {
    if (isExpiredSubscriptionError(err)) {
      await deactivateSubscriptionByEndpoint(sub.endpoint);
      return "disabled";
    }
    console.warn("[web-push] delivery failed", {
      endpointHost: safeEndpointHost(sub.endpoint),
    });
    return "failed";
  }
}

function safeEndpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "invalid-endpoint";
  }
}

export async function sendWebPushToUser(
  userId: string,
  payload: WebPushPayload,
): Promise<WebPushDeliveryStats> {
  if (!isWebPushConfigured()) return emptyStats();

  const subs = await listActiveSubscriptionsForUser(userId);
  if (subs.length === 0) return emptyStats();

  let stats = emptyStats();
  for (const sub of subs) {
    const result = await sendToSubscription(sub, payload);
    if (result === "sent") stats.webPushSent += 1;
    if (result === "failed") stats.webPushFailed += 1;
    if (result === "disabled") stats.inactiveSubscriptionsDisabled += 1;
  }
  return stats;
}

export async function sendWebPushToUsers(
  userIds: string[],
  payload: WebPushPayload,
): Promise<WebPushDeliveryStats> {
  if (!isWebPushConfigured() || userIds.length === 0) return emptyStats();

  let stats = emptyStats();
  for (const userId of userIds) {
    const one = await sendWebPushToUser(userId, payload);
    stats = mergeStats(stats, one);
  }
  return stats;
}
