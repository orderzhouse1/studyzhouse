import {
  ensureFirebaseAdmin,
  getFirebaseMessaging,
  isFirebaseAdminConfigured,
} from "./firebaseAdmin.service.js";
import {
  deactivateMobilePushTokenByValue,
  listActiveMobilePushTokensForUser,
} from "./mobilePushToken.service.js";

export type MobilePushPayload = {
  title: string;
  body: string;
  url?: string | null;
  data?: Record<string, string>;
};

export type MobilePushDeliveryStats = {
  mobilePushSent: number;
  mobilePushFailed: number;
  inactiveTokensDisabled: number;
  configured: boolean;
};

function emptyStats(configured: boolean): MobilePushDeliveryStats {
  return {
    mobilePushSent: 0,
    mobilePushFailed: 0,
    inactiveTokensDisabled: 0,
    configured,
  };
}

function isInvalidTokenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code ?? "";
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    code === "messaging/invalid-argument"
  );
}

async function sendToToken(
  token: string,
  payload: MobilePushPayload,
): Promise<"sent" | "failed" | "disabled"> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return "failed";

  const data: Record<string, string> = {
    ...(payload.data ?? {}),
  };
  if (payload.url) {
    data.url = payload.url;
  }

  try {
    await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "studyzhouse_default",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    });
    return "sent";
  } catch (err) {
    if (isInvalidTokenError(err)) {
      await deactivateMobilePushTokenByValue(token);
      return "disabled";
    }
    console.warn("[mobile-push] delivery failed", {
      message: err instanceof Error ? err.message : "unknown",
      code: (err as { code?: string })?.code,
    });
    return "failed";
  }
}

export async function sendMobilePushToUser(
  userId: string,
  payload: MobilePushPayload,
): Promise<MobilePushDeliveryStats> {
  const configured = isFirebaseAdminConfigured() && ensureFirebaseAdmin();
  if (!configured) {
    return emptyStats(false);
  }

  const tokens = await listActiveMobilePushTokensForUser(userId);
  const stats = emptyStats(true);

  for (const row of tokens) {
    const result = await sendToToken(row.token, payload);
    if (result === "sent") stats.mobilePushSent += 1;
    else if (result === "disabled") {
      stats.inactiveTokensDisabled += 1;
      stats.mobilePushFailed += 1;
    } else stats.mobilePushFailed += 1;
  }

  return stats;
}

export async function sendMobilePushTestToUser(
  userId: string,
): Promise<{
  sent: boolean;
  configured: boolean;
  messageId: string | null;
  reason: string | null;
}> {
  const configured = isFirebaseAdminConfigured() && ensureFirebaseAdmin();
  if (!configured) {
    return {
      sent: false,
      configured: false,
      messageId: null,
      reason:
        "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.",
    };
  }

  const tokens = await listActiveMobilePushTokensForUser(userId);
  if (tokens.length === 0) {
    return {
      sent: false,
      configured: true,
      messageId: null,
      reason: "No active FCM tokens registered for this user.",
    };
  }

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return {
      sent: false,
      configured: false,
      messageId: null,
      reason: "Firebase Messaging unavailable.",
    };
  }

  // Prefer the most recently updated token (list order is undefined; use first after refresh).
  const target = tokens[0]!;
  try {
    const messageId = await messaging.send({
      token: target.token,
      notification: {
        title: "اختبار إشعار STUDYZHOUSE",
        body: "هذا إشعار تجريبي من الخادم — إذا ظهر في شريط الإشعارات فالدفع يعمل.",
      },
      data: {
        type: "push_test",
        url: "/notifications",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "studyzhouse_default",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });
    return {
      sent: true,
      configured: true,
      messageId,
      reason: null,
    };
  } catch (err) {
    if (isInvalidTokenError(err)) {
      await deactivateMobilePushTokenByValue(target.token);
    }
    return {
      sent: false,
      configured: true,
      messageId: null,
      reason: err instanceof Error ? err.message : "FCM send failed",
    };
  }
}
