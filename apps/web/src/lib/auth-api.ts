import type {
  AuthUser,
  ForgotPasswordRequestOtpBody,
  ForgotPasswordResendOtpBody,
  ForgotPasswordVerifyOtpBody,
  LoginBody,
  SignupBody,
  SignupOtpResendBody,
  SignupOtpVerifyBody,
} from "@studyhouse/shared";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

type ApiErrorJson = {
  success?: boolean;
  error?: {
    message?: string;
    code?: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
      resendAvailableAt?: string;
    };
  };
};

function mapApiError(json: ApiErrorJson | null, fallback: string) {
  return {
    ok: false as const,
    message: json?.error?.message ?? fallback,
    code: json?.error?.code,
    fieldErrors: json?.error?.details?.fieldErrors,
    resendAvailableAt: json?.error?.details?.resendAvailableAt as
      | string
      | undefined,
  };
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

  const json = (await parseJson(res)) as ApiErrorJson | null;

  if (!json || json.success !== true) {
    return {
      ...mapApiError(json, "تعذّر تسجيل الدخول."),
      status: res.status,
    };
  }

  const okJson = json as { success: true; data?: { user?: AuthUser } };
  return {
    ok: true,
    status: res.status,
    user: okJson.data?.user,
  };
}

export type SignupOtpRequestResult =
  | {
      ok: true;
      challengeId: string;
      expiresAt: string;
      resendAvailableAt: string;
      message: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function signupRequestOtp(
  body: SignupBody,
): Promise<SignupOtpRequestResult> {
  const res = await fetch("/api/v1/auth/signup/request-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: {
      challengeId?: string;
      expiresAt?: string;
      resendAvailableAt?: string;
      message?: string;
    };
  } | null;

  if (!json || json.success !== true || !json.data?.challengeId) {
    const err = mapApiError(json, "تعذّر إرسال رمز التحقق.");
    return { ...err, status: res.status };
  }

  return {
    ok: true,
    challengeId: json.data.challengeId,
    expiresAt: json.data.expiresAt ?? "",
    resendAvailableAt: json.data.resendAvailableAt ?? "",
    message: json.data.message ?? "أُرسل رمز التحقق إلى بريدك.",
  };
}

export type SignupVerifyResult =
  | { ok: true; message: string }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
    };

export async function signupVerifyOtp(
  body: SignupOtpVerifyBody,
): Promise<SignupVerifyResult> {
  const res = await fetch("/api/v1/auth/signup/verify-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: { message?: string };
  } | null;

  if (!json || json.success !== true) {
    return {
      ...mapApiError(json, "تعذّر التحقق من الرمز."),
      status: res.status,
    };
  }

  return {
    ok: true,
    message:
      json.data?.message ??
      "تم تأكيد بريدك وإنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن.",
  };
}

export type SignupResendResult =
  | {
      ok: true;
      expiresAt: string;
      resendAvailableAt: string;
      message: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
      resendAvailableAt?: string;
    };

export async function signupResendOtp(
  body: SignupOtpResendBody,
): Promise<SignupResendResult> {
  const res = await fetch("/api/v1/auth/signup/resend-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: {
      expiresAt?: string;
      resendAvailableAt?: string;
      message?: string;
    };
  } | null;

  if (!json || json.success !== true) {
    const err = mapApiError(json, "تعذّر إعادة إرسال الرمز.");
    return {
      ...err,
      status: res.status,
      resendAvailableAt: err.resendAvailableAt,
    };
  }

  return {
    ok: true,
    expiresAt: json.data?.expiresAt ?? "",
    resendAvailableAt: json.data?.resendAvailableAt ?? "",
    message: json.data?.message ?? "أُعيد إرسال رمز التحقق.",
  };
}

export type ForgotPasswordRequestResult =
  | {
      ok: true;
      message: string;
      challengeId?: string;
      resendAvailableAt?: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
    };

export async function forgotPasswordRequestOtp(
  body: ForgotPasswordRequestOtpBody,
): Promise<ForgotPasswordRequestResult> {
  const res = await fetch("/api/v1/auth/forgot-password/request-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: {
      message?: string;
      challengeId?: string;
      resendAvailableAt?: string;
    };
  } | null;

  if (!json || json.success !== true) {
    const err = mapApiError(json, "تعذّر إرسال رمز التحقق.");
    return { ...err, status: res.status };
  }

  return {
    ok: true,
    message: json.data?.message ?? "",
    challengeId: json.data?.challengeId,
    resendAvailableAt: json.data?.resendAvailableAt,
  };
}

export type ForgotPasswordVerifyResult =
  | { ok: true; message: string }
  | {
      ok: false;
      status: number;
      message: string;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function forgotPasswordVerifyOtp(
  body: ForgotPasswordVerifyOtpBody,
): Promise<ForgotPasswordVerifyResult> {
  const res = await fetch("/api/v1/auth/forgot-password/verify-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: { message?: string };
  } | null;

  if (!json || json.success !== true) {
    const err = mapApiError(json, "تعذّر تغيير كلمة المرور.");
    return { ...err, status: res.status };
  }

  return {
    ok: true,
    message:
      json.data?.message ??
      "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
  };
}

export async function forgotPasswordResendOtp(
  body: ForgotPasswordResendOtpBody,
): Promise<SignupResendResult> {
  const res = await fetch("/api/v1/auth/forgot-password/resend-otp", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  const json = (await parseJson(res)) as ApiErrorJson & {
    data?: {
      message?: string;
      resendAvailableAt?: string;
      expiresAt?: string;
    };
  } | null;

  if (!json || json.success !== true) {
    const err = mapApiError(json, "تعذّر إعادة إرسال الرمز.");
    return {
      ...err,
      status: res.status,
      resendAvailableAt: err.resendAvailableAt,
    };
  }

  return {
    ok: true,
    expiresAt: json.data?.expiresAt ?? "",
    resendAvailableAt: json.data?.resendAvailableAt ?? "",
    message: json.data?.message ?? "أُعيد إرسال رمز التحقق.",
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
