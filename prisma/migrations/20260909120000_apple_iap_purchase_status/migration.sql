-- AlterEnum
CREATE TYPE "AppleIapPurchaseStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "AppleIapPurchase"
ADD COLUMN "status" "AppleIapPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "rawSignedTransaction" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "AppleIapPurchase_status_idx" ON "AppleIapPurchase"("status");

-- CreateIndex
CREATE INDEX "AppleIapPurchase_originalTransactionId_idx" ON "AppleIapPurchase"("originalTransactionId");
