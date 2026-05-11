import type { Course, Lesson } from "@prisma/client";
import { CourseStatus } from "@prisma/client";

/** مطابقة لواجهة البناء — قائمة تحقق النشر */
export type PublishReadinessFlags = {
  hasTitle: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  hasSection: boolean;
  hasLesson: boolean;
  allLessonsHaveVideos: boolean;
};

export type PublishReadiness = PublishReadinessFlags & {
  canPublish: boolean;
};

const TITLE_MIN_LEN = 3;
const DESCRIPTION_MIN_LEN = 10;

/** معرف فيديو يوتيوب يدوياً مخزَّناً — أحرف مسموحة للمعرف النموذجي */
function isValidYoutubeVideoId(id: string | null | undefined): boolean {
  const t = id?.trim();
  if (!t) return false;
  return /^[\w-]{11}$/.test(t);
}

/**
 * حساب الجاهزية من الكورس وأقسامه (مع الدروس ضمن كل قسم).
 * يُستخدَم في هيكل الكورس وفي حارس النشر.
 */
export function computePublishReadiness(
  course: Course,
  sections: Array<{ lessons: Lesson[] }>,
): PublishReadiness {
  const lessonsFlat = sections.flatMap((s) => s.lessons);
  const hasTitle = course.title.trim().length >= TITLE_MIN_LEN;
  const hasDescription = course.description.trim().length >= DESCRIPTION_MIN_LEN;
  const hasCategory = course.categoryId !== null;
  const hasSection = sections.length > 0;
  const hasLesson = lessonsFlat.length > 0;
  /** يكفي معرف فيديو يوتيوب صالح لكل درس (يتوافق مع حارس النشر في الخادم) */
  const allLessonsHaveVideos =
    lessonsFlat.length > 0 &&
    lessonsFlat.every((l) => isValidYoutubeVideoId(l.youtubeVideoId));

  const canPublish =
    hasTitle &&
    hasDescription &&
    hasCategory &&
    hasSection &&
    hasLesson &&
    allLessonsHaveVideos &&
    course.status !== CourseStatus.ARCHIVED;

  return {
    hasTitle,
    hasDescription,
    hasCategory,
    hasSection,
    hasLesson,
    allLessonsHaveVideos,
    canPublish,
  };
}

/**
 * رسائل بالعربية للمتطلبات الناقصة — تُستخدم في 400 عند محاولة النشر.
 */
export function publishReadinessMissingMessages(
  course: Course,
  flags: PublishReadinessFlags,
): string[] {
  if (course.status === CourseStatus.ARCHIVED) {
    return ["لا يمكن نشر كورس مؤرشف."];
  }

  const missing: string[] = [];

  if (!flags.hasTitle) {
    missing.push("يجب أن يكون عنوان الكورس واضحًا (ثلاثة أحرف على الأقل).");
  }
  if (!flags.hasDescription) {
    missing.push("يجب إضافة وصف كافٍ للكورس.");
  }
  if (!flags.hasCategory) {
    missing.push("يجب اختيار تصنيف للكورس.");
  }
  if (!flags.hasSection) {
    missing.push("يجب إضافة قسم واحد على الأقل.");
  }
  if (!flags.hasLesson) {
    missing.push("يجب إضافة درس واحد على الأقل.");
  }
  if (!flags.allLessonsHaveVideos) {
    missing.push("كل الدروس يجب أن تحتوي على فيديو");
  }

  return missing;
}
