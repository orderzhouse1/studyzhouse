import type { WebPushPublicKeyResponse } from "@studyhouse/shared";

import {
  StudentApiError,
  studentFetchJson,
} from "@/lib/student-client-api";

type SubscribeResponse = {
  success: true;
  data: { subscribed: boolean; subscriptionId: string };
};

export async function fetchWebPushPublicKey(): Promise<WebPushPublicKeyResponse> {
  const json = await studentFetchJson<{ success: true; data: WebPushPublicKeyResponse }>(
    "/student/web-push/public-key",
  );
  return json.data;
}

export async function subscribeWebPushOnServer(body: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> {
  await studentFetchJson<SubscribeResponse>("/student/web-push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function unsubscribeWebPushOnServer(endpoint: string): Promise<void> {
  await studentFetchJson<{ success: true }>("/student/web-push/unsubscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

export { StudentApiError };
