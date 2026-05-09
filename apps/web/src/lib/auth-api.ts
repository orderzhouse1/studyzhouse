import type { AuthUser, LoginBody } from "@studyhouse/shared";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function loginRequest(body: LoginBody): Promise<{
  ok: boolean;
  status: number;
  user?: AuthUser;
  message?: string;
  code?: string;
}> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as
    | {
        success?: boolean;
        data?: { user?: AuthUser };
        error?: { message?: string; code?: string };
      }
    | null;

  if (!json || json.success !== true) {
    return {
      ok: false,
      status: res.status,
      message: json?.error?.message ?? "تعذّر تسجيل الدخول.",
      code: json?.error?.code,
    };
  }

  return {
    ok: true,
    status: res.status,
    user: json.data?.user,
  };
}

export async function logoutRequest(): Promise<boolean> {
  const res = await fetch("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: "{}",
  });
  return res.ok;
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/v1/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const json = (await parseJson(res)) as
    | { success?: boolean; data?: { user?: AuthUser } }
    | null;

  if (!json || json.success !== true) return null;
  return json.data?.user ?? null;
}
