ALTER TABLE "users"
  ADD COLUMN "name" TEXT;

UPDATE "users"
SET "name" = split_part("email", '@', 1)
WHERE "name" IS NULL;

ALTER TABLE "support_requests"
  ADD COLUMN "statusUpdatedByName" TEXT,
  ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);
