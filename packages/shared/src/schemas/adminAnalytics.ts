import { z } from "zod";

export const adminAnalyticsDateRangeQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type AdminAnalyticsDateRangeQuery = z.infer<
  typeof adminAnalyticsDateRangeQuerySchema
>;

export const adminAnalyticsDailyCountSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0),
});

export type AdminAnalyticsDailyCount = z.infer<
  typeof adminAnalyticsDailyCountSchema
>;

export const adminAnalyticsOverviewSchema = z.object({
  totalStudents: z.number().int().min(0),
  newStudents7d: z.number().int().min(0),
  newStudents30d: z.number().int().min(0),
  activeStudents7d: z.number().int().min(0),
  activeStudents30d: z.number().int().min(0),
  totalPublishedCourses: z.number().int().min(0),
  totalEnrollments: z.number().int().min(0),
  pendingPaymentRequests: z.number().int().min(0),
  approvedPaymentRequests: z.number().int().min(0),
  rejectedPaymentRequests: z.number().int().min(0),
  newReviews7d: z.number().int().min(0),
  pendingReviews: z.number().int().min(0),
  activationCodesUsed7d: z.number().int().min(0),
  averageCourseCompletionPercent: z.number().min(0).max(100),
});

export type AdminAnalyticsOverview = z.infer<
  typeof adminAnalyticsOverviewSchema
>;

export const adminAnalyticsCourseRowSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  slug: z.string(),
  enrollmentCount: z.number().int().min(0),
  reviewCount: z.number().int().min(0),
  averageRating: z.number().nullable(),
  averageCompletionPercent: z.number().min(0).max(100),
  completedStudentsCount: z.number().int().min(0),
});

export type AdminAnalyticsCourseRow = z.infer<
  typeof adminAnalyticsCourseRowSchema
>;

export const adminAnalyticsCoursesSchema = z.object({
  topByEnrollments: z.array(adminAnalyticsCourseRowSchema),
  topByRating: z.array(adminAnalyticsCourseRowSchema),
  highestCompletion: z.array(adminAnalyticsCourseRowSchema),
  lowestCompletion: z.array(adminAnalyticsCourseRowSchema),
  allCourses: z.array(adminAnalyticsCourseRowSchema),
});

export type AdminAnalyticsCourses = z.infer<typeof adminAnalyticsCoursesSchema>;

export const adminAnalyticsStudentLeaderSchema = z.object({
  studentId: z.string(),
  fullName: z.string(),
  email: z.string(),
  enrolledCoursesCount: z.number().int().min(0),
  averageProgressPercent: z.number().min(0).max(100),
  lastActivityAt: z.string().datetime().nullable(),
});

export type AdminAnalyticsStudentLeader = z.infer<
  typeof adminAnalyticsStudentLeaderSchema
>;

export const adminAnalyticsCountryBucketSchema = z.object({
  country: z.string(),
  count: z.number().int().min(0),
});

export const adminAnalyticsStudentsSchema = z.object({
  newStudents7d: z.number().int().min(0),
  newStudents30d: z.number().int().min(0),
  activeStudents7d: z.number().int().min(0),
  inactiveStudents7d: z.number().int().min(0),
  inactiveStudents14d: z.number().int().min(0),
  topProgressStudents: z.array(adminAnalyticsStudentLeaderSchema),
  staleEnrollmentStudents: z.array(adminAnalyticsStudentLeaderSchema),
  countryDistribution: z.array(adminAnalyticsCountryBucketSchema),
});

export type AdminAnalyticsStudents = z.infer<
  typeof adminAnalyticsStudentsSchema
>;

export const adminAnalyticsLessonCompletionSchema = z.object({
  lessonId: z.string(),
  lessonTitle: z.string(),
  courseTitle: z.string(),
  completionCount: z.number().int().min(0),
});

export const adminAnalyticsCourseProgressSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  slug: z.string(),
  progressEvents: z.number().int().min(0),
  completedLessons: z.number().int().min(0),
});

export const adminAnalyticsEngagementSchema = z.object({
  totalLessonProgressRecords: z.number().int().min(0),
  completedLessonsCount: z.number().int().min(0),
  averageWatchedSeconds: z.number().min(0),
  topCompletedLessons: z.array(adminAnalyticsLessonCompletionSchema),
  topCoursesByProgress: z.array(adminAnalyticsCourseProgressSchema),
  enrollmentsByDay: z.array(adminAnalyticsDailyCountSchema),
  reviewsByDay: z.array(adminAnalyticsDailyCountSchema),
  paymentRequestsByDay: z.array(adminAnalyticsDailyCountSchema),
});

export type AdminAnalyticsEngagement = z.infer<
  typeof adminAnalyticsEngagementSchema
>;
