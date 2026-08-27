ALTER TABLE "support_requests"
  ADD COLUMN "requestSubType" TEXT;

ALTER TABLE "support_requests"
  DROP COLUMN "priority";

ALTER TABLE "form_settings"
  ADD COLUMN "requestTypeOptions" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "form_settings"
SET "requestTypeOptions" = '{"Hardware":["Desktop","Laptop"],"Software":["Installation","Error"],"Network":["Internet","Wi-Fi"],"Account / Access":["Password","Permission"],"Printer":["Cannot print","Paper jam"],"Other":[]}'::jsonb
WHERE "id" = 1;

ALTER TABLE "form_settings"
  DROP COLUMN "priorities";