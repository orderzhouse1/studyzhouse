import { z } from "zod";

import { userStatusSchema } from "./auth";

export const STUDENT_INTEREST_IDS = [
  "programming",
  "design",
  "business",
  "languages",
  "university",
  "marketing",
  "finance",
  "personal_development",
] as const;

export const STUDENT_LEARNING_GOAL_IDS = [
  "career",
  "university",
  "skill",
  "certificate",
  "hobby",
] as const;

export const studentProfileLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

export const studentGenderSchema = z.enum([
  "MALE",
  "FEMALE",
  "PREFER_NOT_TO_SAY",
  "OTHER",
]);

export const weeklyStudyTimeSchema = z.enum([
  "UNDER_2H",
  "HOURS_2_5",
  "HOURS_5_10",
  "OVER_10H",
]);

export const preferredLearningStyleSchema = z.enum([
  "VIDEO",
  "READING",
  "PRACTICE",
  "MIXED",
]);

export const studentInterestIdSchema = z.enum(STUDENT_INTEREST_IDS);

export const studentLearningGoalIdSchema = z.enum(STUDENT_LEARNING_GOAL_IDS);

const interestsArraySchema = z
  .array(studentInterestIdSchema)
  .min(1, "اختر اهتمامًا واحدًا على الأقل.")
  .max(10, "يمكنك اختيار 10 اهتمامات كحد أقصى.");

const learningGoalsArraySchema = z
  .array(studentLearningGoalIdSchema)
  .min(1, "اختر هدفًا واحدًا على الأقل.")
  .max(5, "يمكنك اختيار 5 أهداف كحد أقصى.");

const optionalPhoneSchema = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z
    .string()
    .trim()
    .min(7, "رقم الهاتف قصير جدًا.")
    .max(20, "رقم الهاتف طويل جدًا.")
    .regex(/^[\d\s+()-]+$/, "صيغة رقم الهاتف غير صالحة.")
    .optional(),
);

const optionalCountrySchema = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().trim().min(2).max(80).optional(),
);

const optionalBirthYearSchema = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce
    .number()
    .int()
    .min(1940)
    .max(new Date().getFullYear())
    .optional(),
);

const profileFieldsSchema = z.object({
  country: optionalCountrySchema,
  phone: optionalPhoneSchema,
  gender: studentGenderSchema.optional(),
  birthYear: optionalBirthYearSchema,
  currentLevel: studentProfileLevelSchema.optional(),
  learningGoals: learningGoalsArraySchema.optional(),
  interests: interestsArraySchema.optional(),
  weeklyStudyTime: weeklyStudyTimeSchema.optional(),
  preferredLearningStyle: preferredLearningStyleSchema.optional(),
});

export const studentProfilePatchBodySchema = profileFieldsSchema
  .partial()
  .extend({
    fullName: z
      .string()
      .trim()
      .min(2, "الاسم قصير جدًا.")
      .max(120, "الاسم طويل جدًا.")
      .optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "لا يوجد شيء للتحديث.",
  });

export const studentAccountSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  status: userStatusSchema,
  hasGoogleLogin: z.boolean(),
});

export const studentOnboardingCompleteBodySchema = z.object({
  currentLevel: studentProfileLevelSchema,
  learningGoals: learningGoalsArraySchema,
  interests: interestsArraySchema,
  weeklyStudyTime: weeklyStudyTimeSchema.optional(),
  preferredLearningStyle: preferredLearningStyleSchema.optional(),
  country: optionalCountrySchema,
  phone: optionalPhoneSchema,
  gender: studentGenderSchema.optional(),
  birthYear: optionalBirthYearSchema,
});

export const studentOnboardingSkipBodySchema = z.object({});

export const studentProfileDtoSchema = z.object({
  country: z.string().nullable(),
  phone: z.string().nullable(),
  gender: studentGenderSchema.nullable(),
  birthYear: z.number().int().nullable(),
  currentLevel: studentProfileLevelSchema.nullable(),
  learningGoals: z.array(studentLearningGoalIdSchema),
  interests: z.array(studentInterestIdSchema),
  weeklyStudyTime: weeklyStudyTimeSchema.nullable(),
  preferredLearningStyle: preferredLearningStyleSchema.nullable(),
  onboardingCompletedAt: z.string().datetime().nullable(),
  onboardingSkippedAt: z.string().datetime().nullable(),
  needsOnboarding: z.boolean(),
});

export const studentProfilePageSchema = z.object({
  account: studentAccountSchema,
  profile: studentProfileDtoSchema,
});

export type StudentProfilePatchBody = z.infer<
  typeof studentProfilePatchBodySchema
>;
export type StudentAccount = z.infer<typeof studentAccountSchema>;
export type StudentProfilePage = z.infer<typeof studentProfilePageSchema>;
export type StudentOnboardingCompleteBody = z.infer<
  typeof studentOnboardingCompleteBodySchema
>;
export type StudentProfileDto = z.infer<typeof studentProfileDtoSchema>;

export type StudentInterestId = (typeof STUDENT_INTEREST_IDS)[number];
export type StudentLearningGoalId = (typeof STUDENT_LEARNING_GOAL_IDS)[number];
