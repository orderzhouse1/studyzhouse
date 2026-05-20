export function getInternalApiOrigin(): string {
  return process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
}

function isProductionServer(): boolean {
  return process.env.NODE_ENV === "production";
}

/** منشأ API للسجلات فقط — بدون مسارات سرية */
function apiHostForLogs(): string {
  try {
    return new URL(getInternalApiOrigin()).host;
  } catch {
    return "(invalid API_INTERNAL_URL)";
  }
}

function logPublicFetchFailure(
  path: string,
  reason: "network" | "http",
  detail?: string,
): void {
  if (!isProductionServer()) return;
  const suffix = detail ? ` — ${detail}` : "";
  console.warn(
    `[studyhouse/web] Public API fetch failed for ${path} (api host: ${apiHostForLogs()}, ${reason})${suffix}. Public pages may show empty courses until API_INTERNAL_URL and API health are fixed.`,
  );
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

function connectionErrorDetail(err: unknown): string {
  if (!(err instanceof Error)) return "unknown error";
  const cause = err.cause instanceof Error ? err.cause.message : "";
  return cause ? `${err.message} (${cause})` : err.message;
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
export async function fetchPublicApi(
  path: string,
  options?: { noStore?: boolean; revalidate?: number },
): Promise<unknown> {
  const origin = getInternalApiOrigin();
  const url = `${origin}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      ...(options?.noStore
        ? { cache: "no-store" as const }
        : { next: { revalidate: options?.revalidate ?? 60 } }),
    });
  } catch (err) {
    if (isProductionServer()) {
      logPublicFetchFailure(path, "network", connectionErrorDetail(err));
    }
    throw wrapFetchError(url, origin, err);
  }
  if (!res.ok) {
    logPublicFetchFailure(path, "http", `status ${res.status}`);
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}

/**
 * جلب اختياري: 404 → null. أخطاء اتصال (API غير متاح) → null بدون رمي،
 * لتجنّب كسر البناء/الميتاداتا عندما لا يعمل الخادم؛ وقت التشغيل يعرض notFound أو فراغًا حسب الصفحة.
 * في الإنتاج: يُسجَّل تحذير في سجلات الخادم عند فشل الاتصال أو HTTP غير ناجح (ما عدا 404).
 */
export async function fetchPublicApiMaybe(
  path: string,
  options?: { revalidate?: number },
): Promise<unknown | null> {
  const origin = getInternalApiOrigin();
  const url = `${origin}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: options?.revalidate ?? 60 },
    });
  } catch (err) {
    if (isLikelyConnectionError(err)) {
      logPublicFetchFailure(path, "network", connectionErrorDetail(err));
      return null;
    }
    throw wrapFetchError(url, origin, err);
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    logPublicFetchFailure(path, "http", `status ${res.status}`);
    throw new Error(`PUBLIC_API_${res.status}`);
  }
  return res.json();
}
