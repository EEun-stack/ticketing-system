ALTER TABLE "support_requests"
  ADD COLUMN "controlId" TEXT;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY to_char("createdAt" AT TIME ZONE 'UTC', 'YYYYMMDD')
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_num
  FROM "support_requests"
  WHERE "controlId" IS NULL
)
UPDATE "support_requests" AS sr
SET "controlId" = 'REQ-' || to_char(sr."createdAt" AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || lpad(CAST(r.row_num AS TEXT), 4, '0')
FROM ranked AS r
WHERE sr."id" = r."id";

ALTER TABLE "support_requests"
  ALTER COLUMN "controlId" SET NOT NULL;

ALTER TABLE "support_requests"
  ADD CONSTRAINT "support_requests_controlId_key"
  UNIQUE ("controlId");
