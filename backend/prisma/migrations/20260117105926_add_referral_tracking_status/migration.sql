-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");
