-- AlterEnum
ALTER TYPE "EnrollmentSource" ADD VALUE 'APPLE_IAP';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "appleProductId" TEXT,
ADD COLUMN "iosPurchasable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Course_appleProductId_key" ON "Course"("appleProductId");

-- CreateIndex
CREATE INDEX "Course_iosPurchasable_appleProductId_idx" ON "Course"("iosPurchasable", "appleProductId");

-- CreateTable
CREATE TABLE "AppleIapPurchase" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "appleProductId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "originalTransactionId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "environment" TEXT NOT NULL,
    "verificationPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppleIapPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppleIapPurchase_transactionId_key" ON "AppleIapPurchase"("transactionId");

-- CreateIndex
CREATE INDEX "AppleIapPurchase_studentId_idx" ON "AppleIapPurchase"("studentId");

-- CreateIndex
CREATE INDEX "AppleIapPurchase_courseId_idx" ON "AppleIapPurchase"("courseId");

-- CreateIndex
CREATE INDEX "AppleIapPurchase_appleProductId_idx" ON "AppleIapPurchase"("appleProductId");

-- AddForeignKey
ALTER TABLE "AppleIapPurchase" ADD CONSTRAINT "AppleIapPurchase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppleIapPurchase" ADD CONSTRAINT "AppleIapPurchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
