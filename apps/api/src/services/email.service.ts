import { Resend } from "resend";

import { loadEnv } from "../config/env.js";
import { AppError } from "../lib/AppError.js";

export function isEmailConfigured(): boolean {
  const env = loadEnv();
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
}

export async function sendSignupOtpEmail(input: {
  to: string;
  fullName: string;
  code: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (!isEmailConfigured()) {
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "إرسال البريد غير مفعّل. أضف RESEND_API_KEY و EMAIL_FROM في ملف البيئة (.env) لخادم API.",
      503,
    );
  }

  const env = loadEnv();
  const resend = new Resend(env.RESEND_API_KEY!);
  const from = env.EMAIL_FROM!;

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: "رمز تأكيد التسجيل — Studyhouse",
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
        <p>مرحبًا ${escapeHtml(input.fullName)}،</p>
        <p>رمز التحقق لتأكيد بريدك وإنشاء حسابك:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${escapeHtml(input.code)}</p>
        <p>صالح لمدة 10 دقائق. لا تشارك هذا الرمز مع أحد.</p>
        <p style="color: #666; font-size: 13px;">إن لم تطلب التسجيل، تجاهل هذه الرسالة.</p>
      </div>
    `.trim(),
    text: `مرحبًا ${input.fullName}،\nرمز التحقق: ${input.code}\nصالح لمدة 10 دقائق.`,
  });

  if (error) {
    throw new AppError(
      "EMAIL_SEND_FAILED",
      "تعذّر إرسال رمز التحقق. حاول لاحقًا.",
      502,
      { providerMessage: error.message },
    );
  }
}

export async function sendPasswordResetOtpEmail(input: {
  to: string;
  fullName: string;
  code: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (!isEmailConfigured()) {
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "إرسال البريد غير مفعّل. أضف RESEND_API_KEY و EMAIL_FROM في ملف البيئة (.env) لخادم API.",
      503,
    );
  }

  const env = loadEnv();
  const resend = new Resend(env.RESEND_API_KEY!);
  const from = env.EMAIL_FROM!;

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: "رمز إعادة تعيين كلمة المرور — Studyhouse",
    html: `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
        <p>مرحبًا ${escapeHtml(input.fullName)}،</p>
        <p>رمز إعادة تعيين كلمة المرور:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${escapeHtml(input.code)}</p>
        <p>صالح لمدة 10 دقائق. لا تشارك هذا الرمز مع أحد.</p>
        <p style="color: #666; font-size: 13px;">إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.</p>
      </div>
    `.trim(),
    text: `مرحبًا ${input.fullName}،\nرمز إعادة التعيين: ${input.code}\nصالح لمدة 10 دقائق.\nإذا لم تطلب إعادة التعيين، تجاهل الرسالة.`,
  });

  if (error) {
    throw new AppError(
      "EMAIL_SEND_FAILED",
      "تعذّر إرسال رمز التحقق. حاول لاحقًا.",
      502,
      { providerMessage: error.message },
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
