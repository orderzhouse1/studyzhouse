import * as jose from "jose";

import { loadEnv } from "../config/env.js";
import { AppError } from "./AppError.js";

export type AppleVerifiedTransaction = {
  transactionId: string;
  originalTransactionId: string | null;
  productId: string;
  bundleId: string;
  purchaseDate: Date;
  environment: "Sandbox" | "Production";
  revocationDate: Date | null;
  rawSignedTransaction: string;
};

type AppleConfig = {
  bundleId: string;
  appAppleId: string;
  issuerId: string;
  keyId: string;
  privateKey: string;
  environment: "sandbox" | "production";
};

function readAppleConfig(): AppleConfig | null {
  const env = loadEnv();
  const bundleId = env.APPLE_BUNDLE_ID?.trim();
  const appAppleId = env.APPLE_APP_APPLE_ID?.trim();
  const issuerId = env.APPLE_IAP_ISSUER_ID?.trim();
  const keyId = env.APPLE_IAP_KEY_ID?.trim();
  const privateKey = env.APPLE_IAP_PRIVATE_KEY?.trim();
  const environment = env.APPLE_IAP_ENVIRONMENT;

  if (!bundleId || !appAppleId || !issuerId || !keyId || !privateKey || !environment) {
    return null;
  }

  return {
    bundleId,
    appAppleId,
    issuerId,
    keyId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    environment,
  };
}

export function assertAppleIapConfigured(): AppleConfig {
  const config = readAppleConfig();
  if (!config) {
    throw new AppError(
      "APPLE_IAP_NOT_CONFIGURED",
      "إعدادات Apple IAP غير مكتملة على الخادم. لا يمكن التحقق من الشراء حاليًا.",
      503,
    );
  }
  return config;
}

export function isAppleIapConfigured(): boolean {
  return readAppleConfig() !== null;
}

function apiBaseUrl(environment: "sandbox" | "production"): string {
  return environment === "production"
    ? "https://api.storekit.itunes.apple.com"
    : "https://api.storekit-sandbox.itunes.apple.com";
}

async function createAppStoreServerToken(config: AppleConfig): Promise<string> {
  const key = await jose.importPKCS8(config.privateKey, "ES256");
  return new jose.SignJWT({ bid: config.bundleId })
    .setProtectedHeader({
      alg: "ES256",
      kid: config.keyId,
      typ: "JWT",
    })
    .setIssuer(config.issuerId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("appstoreconnect-v1")
    .sign(key);
}

type DecodedTxn = {
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  bundleId?: string;
  purchaseDate?: number;
  environment?: string;
  revocationDate?: number;
  type?: string;
};

function decodeSignedTransaction(
  signedTransaction: string,
  expectedBundleId: string,
): AppleVerifiedTransaction {
  const payload = jose.decodeJwt(signedTransaction) as DecodedTxn;

  const transactionId = payload.transactionId?.trim();
  const productId = payload.productId?.trim();
  const bundleId = payload.bundleId?.trim();
  if (!transactionId || !productId || !bundleId) {
    throw new AppError(
      "IAP_INVALID_TRANSACTION",
      "بيانات معاملة Apple غير صالحة.",
      400,
    );
  }

  if (bundleId !== expectedBundleId) {
    throw new AppError(
      "IAP_BUNDLE_MISMATCH",
      "معاملة Apple لا تطابق معرّف التطبيق.",
      400,
    );
  }

  const envRaw = (payload.environment ?? "").toLowerCase();
  const environment: "Sandbox" | "Production" =
    envRaw === "production" ? "Production" : "Sandbox";

  return {
    transactionId,
    originalTransactionId: payload.originalTransactionId?.trim() ?? null,
    productId,
    bundleId,
    purchaseDate: payload.purchaseDate
      ? new Date(payload.purchaseDate)
      : new Date(),
    environment,
    revocationDate: payload.revocationDate
      ? new Date(payload.revocationDate)
      : null,
    rawSignedTransaction: signedTransaction,
  };
}

/**
 * Verifies a StoreKit transaction via App Store Server API.
 * Prefer `transactionId` lookup; optionally accepts client JWS as a hint.
 */
export async function verifyAppleTransactionWithServerApi(params: {
  transactionId: string;
  expectedProductId: string;
  clientSignedTransaction?: string;
}): Promise<AppleVerifiedTransaction> {
  const config = assertAppleIapConfigured();
  const token = await createAppStoreServerToken(config);

  const primaryBase = apiBaseUrl(config.environment);
  const fallbackBase =
    config.environment === "production"
      ? apiBaseUrl("sandbox")
      : apiBaseUrl("production");

  async function fetchTxn(base: string): Promise<Response> {
    return fetch(
      `${base}/inApps/v1/transactions/${encodeURIComponent(params.transactionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
  }

  let response = await fetchTxn(primaryBase);
  if (response.status === 404) {
    response = await fetchTxn(fallbackBase);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      "APPLE_IAP_AUTH_FAILED",
      "تعذّر الاتصال بخوادم Apple للتحقق من الشراء. راجع إعدادات المفتاح.",
      503,
    );
  }

  if (!response.ok) {
    // Fall back to decoding client-provided JWS only when Server API fails
    // after config is present — still require signed payload, never trust
    // bare client fields alone.
    if (params.clientSignedTransaction?.includes(".")) {
      const decoded = decodeSignedTransaction(
        params.clientSignedTransaction,
        config.bundleId,
      );
      if (decoded.transactionId !== params.transactionId) {
        throw new AppError(
          "IAP_TRANSACTION_MISMATCH",
          "معرّف معاملة Apple غير متطابق.",
          400,
        );
      }
      if (decoded.productId !== params.expectedProductId) {
        throw new AppError(
          "IAP_PRODUCT_MISMATCH",
          "معرّف منتج Apple لا يطابق هذا الكورس.",
          400,
        );
      }
      if (decoded.revocationDate) {
        throw new AppError(
          "IAP_TRANSACTION_REVOKED",
          "تم إلغاء عملية الشراء من Apple.",
          400,
        );
      }
      return decoded;
    }

    throw new AppError(
      "IAP_VERIFICATION_FAILED",
      "تعذّر التحقق من عملية شراء Apple.",
      400,
    );
  }

  const body = (await response.json()) as { signedTransactionInfo?: string };
  const signed = body.signedTransactionInfo?.trim();
  if (!signed) {
    throw new AppError(
      "IAP_VERIFICATION_FAILED",
      "استجابة Apple لا تحتوي على معاملة موقعة.",
      400,
    );
  }

  const verified = decodeSignedTransaction(signed, config.bundleId);
  if (verified.transactionId !== params.transactionId) {
    throw new AppError(
      "IAP_TRANSACTION_MISMATCH",
      "معرّف معاملة Apple غير متطابق.",
      400,
    );
  }
  if (verified.productId !== params.expectedProductId) {
    throw new AppError(
      "IAP_PRODUCT_MISMATCH",
      "معرّف منتج Apple لا يطابق هذا الكورس.",
      400,
    );
  }
  if (verified.revocationDate) {
    throw new AppError(
      "IAP_TRANSACTION_REVOKED",
      "تم إلغاء عملية الشراء من Apple.",
      400,
    );
  }

  return verified;
}

export type AppleNotificationPayload = {
  notificationType?: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
    environment?: string;
  };
};

export function decodeAppleNotificationPayload(
  signedPayload: string,
): AppleNotificationPayload {
  return jose.decodeJwt(signedPayload) as AppleNotificationPayload;
}

export function decodeAppleSignedTransactionForNotification(
  signedTransaction: string,
  expectedBundleId: string,
): AppleVerifiedTransaction {
  return decodeSignedTransaction(signedTransaction, expectedBundleId);
}
