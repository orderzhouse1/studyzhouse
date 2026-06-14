import { loadEnv } from "../config/env.js";

/** هل إعداد Cloudinary مكتمل ويُفضَّل استخدامه؟ */
export function isCloudinaryEnabled(): boolean {
  const env = loadEnv();
  if (env.UPLOAD_PROVIDER === "local") return false;
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME?.trim() &&
      env.CLOUDINARY_API_KEY?.trim() &&
      env.CLOUDINARY_API_SECRET?.trim(),
  );
}
