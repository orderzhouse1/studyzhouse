-- CreateTable
CREATE TABLE "CourseRecommendationDismissal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRecommendationDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseRecommendationDismissal_studentId_courseId_key" ON "CourseRecommendationDismissal"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "CourseRecommendationDismissal_studentId_createdAt_idx" ON "CourseRecommendationDismissal"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "CourseRecommendationDismissal" ADD CONSTRAINT "CourseRecommendationDismissal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRecommendationDismissal" ADD CONSTRAINT "CourseRecommendationDismissal_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
