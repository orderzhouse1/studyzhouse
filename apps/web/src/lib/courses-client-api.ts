type ApiErrorJson = {
  success?: boolean;
  error?: { message?: string; code?: string };
};

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
    throw new Error(msg);
  }

  return json as T;
}
