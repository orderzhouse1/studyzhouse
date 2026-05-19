import type {
  StudentInterestId,
  StudentLearningGoalId,
} from "./schemas/studentProfile.js";
import type { z } from "zod";
import type {
  preferredLearningStyleSchema,
  studentGenderSchema,
  studentProfileLevelSchema,
  weeklyStudyTimeSchema,
} from "./schemas/studentProfile.js";

type ProfileLevel = z.infer<typeof studentProfileLevelSchema>;
type Gender = z.infer<typeof studentGenderSchema>;
type WeeklyTime = z.infer<typeof weeklyStudyTimeSchema>;
type LearningStyle = z.infer<typeof preferredLearningStyleSchema>;

export const STUDENT_INTEREST_OPTIONS: Array<{
  id: StudentInterestId;
  labelAr: string;
}> = [
  { id: "programming", labelAr: "برمجة وتقنية" },
  { id: "design", labelAr: "تصميم وإبداع" },
  { id: "business", labelAr: "أعمال وريادة" },
  { id: "languages", labelAr: "لغات" },
  { id: "university", labelAr: "جامعة ودراسة" },
  { id: "marketing", labelAr: "تسويق رقمي" },
  { id: "finance", labelAr: "مالية ومحاسبة" },
  { id: "personal_development", labelAr: "تطوير ذاتي" },
];

export const STUDENT_LEARNING_GOAL_OPTIONS: Array<{
  id: StudentLearningGoalId;
  labelAr: string;
}> = [
  { id: "career", labelAr: "تطوير مهني" },
  { id: "university", labelAr: "النجاح الجامعي" },
  { id: "skill", labelAr: "مهارة جديدة" },
  { id: "certificate", labelAr: "شهادة أو اعتماد" },
  { id: "hobby", labelAr: "هواية وتعلّم ممتع" },
];

export const STUDENT_LEVEL_OPTIONS: Array<{
  id: ProfileLevel;
  labelAr: string;
}> = [
  { id: "BEGINNER", labelAr: "مبتدئ" },
  { id: "INTERMEDIATE", labelAr: "متوسط" },
  { id: "ADVANCED", labelAr: "متقدّم" },
];

export const STUDENT_GENDER_OPTIONS: Array<{ id: Gender; labelAr: string }> = [
  { id: "MALE", labelAr: "ذكر" },
  { id: "FEMALE", labelAr: "أنثى" },
  { id: "PREFER_NOT_TO_SAY", labelAr: "أفضّل عدم الإفصاح" },
  { id: "OTHER", labelAr: "آخر" },
];

export const WEEKLY_STUDY_TIME_OPTIONS: Array<{
  id: WeeklyTime;
  labelAr: string;
}> = [
  { id: "UNDER_2H", labelAr: "أقل من ساعتين أسبوعيًا" },
  { id: "HOURS_2_5", labelAr: "2–5 ساعات أسبوعيًا" },
  { id: "HOURS_5_10", labelAr: "5–10 ساعات أسبوعيًا" },
  { id: "OVER_10H", labelAr: "أكثر من 10 ساعات أسبوعيًا" },
];

export const PREFERRED_LEARNING_STYLE_OPTIONS: Array<{
  id: LearningStyle;
  labelAr: string;
}> = [
  { id: "VIDEO", labelAr: "فيديو وشرح مرئي" },
  { id: "READING", labelAr: "قراءة وملخصات" },
  { id: "PRACTICE", labelAr: "تمارين عملية" },
  { id: "MIXED", labelAr: "مزيج من الأساليب" },
];

/** Simple keyword hints for matching courses to interest ids */
export const STUDENT_INTEREST_MATCH_HINTS: Record<
  StudentInterestId,
  RegExp[]
> = {
  programming: [/برمج|code|dev|تقني|حاسوب|python|جافا/i],
  design: [/تصميم|design|جرافيك|فوتوشوب|ui|ux/i],
  business: [/أعمال|ريادة|إدارة|business|startup/i],
  languages: [/لغة|english|إنجليز|فرنس|عرب/i],
  university: [/جامع|university|أكاديم|كلية|امتحان/i],
  marketing: [/تسويق|marketing|سوشيال|إعلان/i],
  finance: [/مالي|محاسب|finance|استثمار/i],
  personal_development: [/تطوير|ذاتي|تحفيز|قيادة|مهارات/i],
};
