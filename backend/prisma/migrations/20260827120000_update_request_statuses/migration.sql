ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";

CREATE TYPE "RequestStatus" AS ENUM (
  'NEW',
  'PENDING',
  'FOR_APPROVAL',
  'IN_PROGRESS',
  'RESOLVED'
);

ALTER TABLE "support_requests"
  ALTER COLUMN "status" DROP DEFAULT;

UPDATE "support_requests"
SET "status" = 'RESOLVED'
WHERE "status" = 'CLOSED';

ALTER TABLE "support_requests"
  ALTER COLUMN "status" TYPE "RequestStatus"
  USING "status"::text::"RequestStatus";

ALTER TABLE "support_requests"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "RequestStatus_old";
