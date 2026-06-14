import { v2 as cloudinary } from "cloudinary";

import { loadEnv } from "../config/env.js";
import { AppError } from "./AppError.js";

const FOLDER = "studyhouse/course-thumbnails";

let configured = false;

function ensureCloudinaryConfig(): void {
  if (configured) return;
  const env = loadEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
    secure: true,
  });
  configured = true;
}

/**
 * رفع غلاف كورس إلى Cloudinary من data URL.
 * يُرجع الرابط الآمن الكامل (https://res.cloudinary.com/...).
 */
export async function uploadCourseThumbnailToCloudinary(
  dataUrl: string,
): Promise<string> {
  ensureCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.upload(dataUrl.trim(), {
      folder: FOLDER,
      resource_type: "image",
      overwrite: false,
      unique_filename: true,
    });

    if (!result.secure_url) {
      throw new AppError(
        "CLOUDINARY_UPLOAD_FAILED",
        "تعذّر رفع الصورة إلى Cloudinary.",
        502,
      );
    }

    return result.secure_url;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "CLOUDINARY_UPLOAD_FAILED",
      "تعذّر رفع الصورة إلى Cloudinary. تحقق من المفاتيح والاتصال.",
      502,
      err,
    );
  }
}
