ALTER TABLE "support_requests"
  ADD COLUMN "feedback" TEXT,
  ADD COLUMN "feedbackSubmittedAt" TIMESTAMP(3);