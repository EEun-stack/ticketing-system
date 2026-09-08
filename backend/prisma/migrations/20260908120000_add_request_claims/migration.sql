ALTER TABLE "support_requests"
  ADD COLUMN "claimedById" TEXT,
  ADD COLUMN "claimedByName" TEXT;

CREATE INDEX "support_requests_claimedById_idx" ON "support_requests"("claimedById");