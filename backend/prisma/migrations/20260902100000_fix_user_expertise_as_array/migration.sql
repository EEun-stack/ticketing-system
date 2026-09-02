ALTER TABLE "users"
  ALTER COLUMN "expertise" TYPE TEXT[]
  USING CASE
    WHEN "expertise" IS NULL OR "expertise" = '' THEN ARRAY[]::TEXT[]
    ELSE string_to_array(regexp_replace(trim("expertise"), '\s*,\s*', ',', 'g'), ',')
  END;

ALTER TABLE "users"
  ALTER COLUMN "expertise" SET DEFAULT ARRAY[]::TEXT[];
