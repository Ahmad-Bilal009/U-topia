-- CreateTable
CREATE TABLE "CommissionLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "layer" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purchaseAmount" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionLedger_userId_idx" ON "CommissionLedger"("userId");

-- CreateIndex
CREATE INDEX "CommissionLedger_referralId_idx" ON "CommissionLedger"("referralId");

-- CreateIndex
CREATE INDEX "CommissionLedger_layer_idx" ON "CommissionLedger"("layer");

-- CreateIndex
CREATE INDEX "CommissionLedger_createdAt_idx" ON "CommissionLedger"("createdAt");

-- AddForeignKey
ALTER TABLE "CommissionLedger" ADD CONSTRAINT "CommissionLedger_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
