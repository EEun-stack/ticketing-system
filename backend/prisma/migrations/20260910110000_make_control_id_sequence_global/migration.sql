BEGIN;

UPDATE "support_requests"
SET "controlId" = 'MIGRATED-' || "id"
WHERE "controlId" IS NOT NULL;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS row_num
  FROM "support_requests"
)
UPDATE "support_requests" AS sr
SET "controlId" = 'REQ-' || to_char(sr."createdAt" AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || lpad(CAST(r.row_num AS TEXT), 4, '0')
FROM ranked AS r
WHERE sr."id" = r."id";

COMMIT;