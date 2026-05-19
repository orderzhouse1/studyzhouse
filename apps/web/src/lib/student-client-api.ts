type ApiErrorJson = {
  success?: boolean;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

export class StudentApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "StudentApiError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function studentFetchJsonUncached<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const json = (await parseJson(res)) as T & ApiErrorJson;

  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      json.error &&
      typeof json.error.message === "string"
        ? json.error.message
        : "تعذّر تنفيذ الطلب.";
    const code =
      typeof json === "object" &&
      json !== null &&
      json.error &&
      typeof json.error.code === "string"
        ? json.error.code
        : undefined;
    const details =
      typeof json === "object" &&
      json !== null &&
      json.error &&
      "details" in json.error
        ? json.error.details
        : undefined;
    throw new StudentApiError(msg, code, details);
  }

  return json as T;
}

/** Mutations and uncached reads — always hits the network. */
export async function studentFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return studentFetchJsonUncached<T>(path, init);
}

type CacheEntry = { value: unknown; expiresAt: number };

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

/** Short-lived GET cache + in-flight dedupe for student catalog and dashboard reads. */
export function ttlMsForStudentGet(path: string): number | null {
  const base = path.split("?")[0] ?? path;
  if (base === "/auth/me") return 60_000;
  if (base.startsWith("/student/dashboard")) return 30_000;
  if (base.startsWith("/student/profile")) return 30_000;
  if (base.startsWith("/student/my-courses")) return 30_000;
  if (base.startsWith("/student/payment-requests")) return 30_000;
  if (base.startsWith("/courses")) return 45_000;
  if (/^\/student\/courses\/[^/]+\/learn$/.test(base)) return 25_000;
  return null;
}

/**
 * Clears cached GET responses for student-scoped and catalog paths so mutations
 * show fresh enrollment / payment / progress state on the next navigation.
 */
export function invalidateStudentDataCache(): void {
  for (const key of responseCache.keys()) {
    const pathPart = key.slice(key.indexOf(" ") + 1);
    if (
      pathPart.startsWith("/student/") ||
      pathPart.startsWith("/courses")
    ) {
      responseCache.delete(key);
    }
  }
}

/**
 * Cached GET helper: TTL per path prefix, single-flight dedupe, no POST caching.
 */
export async function studentFetchJsonCached<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return studentFetchJsonUncached<T>(path, init);
  }

  const ttl = ttlMsForStudentGet(path);
  if (ttl === null) {
    return studentFetchJsonUncached<T>(path, init);
  }

  const key = `${method} ${path}`;
  const now = Date.now();
  const hit = responseCache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const p = studentFetchJsonUncached<T>(path, init)
    .then((data) => {
      responseCache.set(key, { value: data, expiresAt: Date.now() + ttl });
      inFlight.delete(key);
      return data;
    })
    .catch((err: unknown) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, p);
  return p;
}
