export function getInternalApiOrigin(): string {
  return process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
}

function isLikelyConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const cause = err.cause instanceof Error ? err.cause.message.toLowerCase() : "";
  return (
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("cannot reach api") ||
    cause.includes("econnrefused") ||
    cause.includes("fetch failed")
  );
}

function wrapFetchError(url: string, origin: string, err: unknown): Error {
  const detail =
    err instanceof Error
      ? err.message +
        (err.cause instanceof Error ? ` (${err.cause.message})` : "")
      : String(err);
  return new Error(
    `Cannot reach API at ${url}. Start the Express server (e.g. pnpm dev:api) and ensure API_INTERNAL_URL matches its host/port (currently ${origin}). Underlying: ${detail}`,
    { cause: err },
  );
}

/**
 * جلب JSON عام من Express أثناء SSR.
 * أخطاء الشبكة تُعاد كاستثناء — للصفحات التي يجب أن تفشل صريحًا عند سقوط API أثناء الطلب الحقيقي.
 */
export async function fetchPublicApi(path: string): Promise<unknown> {
  const origin = getInternalApiOrigin();
  const url = `${origin}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch (err) {
    throw wrapFetchError(url, origin, err);
  }
  if (!res.ok) {
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}

/**
 * جلب اختياري: 404 → null. أخطاء اتصال (API غير متاح) → null بدون رمي،
 * لتجنّب كسر البناء/الميتاداتا عندما لا يعمل الخادم؛ وقت التشغيل يعرض notFound أو فراغًا حسب الصفحة.
 */
export async function fetchPublicApiMaybe(path: string): Promise<unknown | null> {
  const origin = getInternalApiOrigin();
  const url = `${origin}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
  } catch (err) {
    if (isLikelyConnectionError(err)) {
      return null;
    }
    throw wrapFetchError(url, origin, err);
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}
