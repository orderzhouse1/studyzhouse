import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { AppError } from "./AppError.js";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/zip": "zip",
};

const ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));

export function getLessonResourcesDir(): string {
  return path.join(process.cwd(), "uploads", "lesson-resources");
}

export async function saveLessonResourceBase64(
  dataUrl: string,
): Promise<string> {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl.trim());
  if (!match) {
    throw new AppError("INVALID_RESOURCE", "الملف غير صالح.", 400);
  }

  const mime = match[1]!.toLowerCase();
  const ext = MIME_TO_EXT[mime];
  if (!ext || !ALLOWED_MIMES.has(mime)) {
    throw new AppError(
      "INVALID_RESOURCE",
      "نوع الملف غير مدعوم. الصور، PDF، أو ZIP فقط.",
      400,
    );
  }

  const buf = Buffer.from(match[2]!, "base64");
  if (buf.length > MAX_BYTES) {
    throw new AppError(
      "RESOURCE_TOO_LARGE",
      "حجم الملف كبير جداً (الحد 8 ميجابايت).",
      400,
    );
  }

  const dir = getLessonResourcesDir();
  await fs.mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);
  return `/api/v1/uploads/lesson-resources/${filename}`;
}
