CREATE SEQUENCE IF NOT EXISTS "support_request_control_id_seq";

SELECT setval(
  'support_request_control_id_seq',
  COALESCE(MAX(CAST(split_part("controlId", '-', 3) AS BIGINT)), 1),
  COUNT(*) > 0
)
FROM "support_requests";