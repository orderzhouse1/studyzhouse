import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { AppError } from "./AppError.js";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getPaymentProofsDir(): string {
  return path.join(process.cwd(), "uploads", "payment-proofs");
}

export async function savePaymentProofBase64(
  dataUrl: string,
): Promise<string> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim(),
  );
  if (!match) {
    throw new AppError(
      "INVALID_PROOF_IMAGE",
      "صورة الإيصال غير صالحة.",
      400,
    );
  }

  const mime = match[1]!.toLowerCase();
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new AppError(
      "INVALID_PROOF_IMAGE",
      "نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.",
      400,
    );
  }

  const buf = Buffer.from(match[2]!, "base64");
  if (buf.length > MAX_BYTES) {
    throw new AppError(
      "PROOF_TOO_LARGE",
      "حجم الصورة كبير جداً (الحد 5 ميجابايت).",
      400,
    );
  }

  const dir = getPaymentProofsDir();
  await fs.mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);
  return `/api/v1/uploads/payment-proofs/${filename}`;
}
