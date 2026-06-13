/** مسار رفع غلاف الكورس — يُخزَّن نسبياً ويُحلّ عند العرض حسب منشأ التطبيق. */
export const COURSE_THUMBNAIL_UPLOAD_PATH_RE =
  /\/api\/v1\/uploads\/course-thumbnails\/[a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp)/i;

/**
 * يُرجع مسار الرفع النسبي إن وُجد، أو الرابط الخارجي كما هو (يوتيوب، unsplash، …).
 * يحوّل `https://studyzhouse.com/api/v1/uploads/...` إلى `/api/v1/uploads/...`
 * حتى يعمل الويب عبر rewrite والموبايل عبر API_BASE_URL.
 */
export function normalizeCourseThumbnailUrl(
  stored: string | null | undefined,
): string | null {
  if (stored == null) return null;
  const trimmed = stored.trim();
  if (!trimmed) return null;

  const uploadMatch = trimmed.match(COURSE_THUMBNAIL_UPLOAD_PATH_RE);
  if (uploadMatch) {
    return uploadMatch[0]!;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("uploads/course-thumbnails/")) {
    return `/api/v1/${trimmed}`;
  }

  if (trimmed.startsWith("/api/v1/uploads/course-thumbnails/")) {
    return trimmed;
  }

  return trimmed;
}
