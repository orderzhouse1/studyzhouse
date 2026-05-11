type ApiErrorJson = {
  success?: boolean;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

/** خطأ API مع تفاصيل اختيارية (مثل قائمة النشر الناقصة) */
export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function adminFetchJson<T>(
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
    throw new AdminApiError(msg, code, details);
  }

  return json as T;
}
