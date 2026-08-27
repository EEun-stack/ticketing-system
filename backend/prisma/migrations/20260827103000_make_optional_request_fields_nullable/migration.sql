ALTER TABLE "support_requests"
  ALTER COLUMN "contact" DROP NOT NULL,
  ALTER COLUMN "subject" DROP NOT NULL,
  ALTER COLUMN "description" DROP NOT NULL;