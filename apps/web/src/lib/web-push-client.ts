"use client";

import {
  fetchWebPushPublicKey,
  subscribeWebPushOnServer,
  unsubscribeWebPushOnServer,
} from "@/lib/student-web-push-api";

export function isWebPushSupportedInBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

export async function registerWebPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupportedInBrowser()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isWebPushSupportedInBrowser()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToWebPush(publicKey: string): Promise<PushSubscription> {
  const reg = await registerWebPushServiceWorker();
  if (!reg) {
    throw new Error("تعذّر تسجيل Service Worker.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("PERMISSION_DENIED");
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("اشتراك غير صالح من المتصفح.");
  }

  await subscribeWebPushOnServer({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });

  return sub;
}

export async function unsubscribeFromWebPush(): Promise<void> {
  const sub = await getExistingPushSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await unsubscribeWebPushOnServer(endpoint);
}

export async function loadWebPushServerConfig(): Promise<{
  configured: boolean;
  publicKey: string | null;
}> {
  return fetchWebPushPublicKey();
}
