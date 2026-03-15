ALTER TABLE "quests"
ADD COLUMN "issuer_user_id" UUID,
ADD COLUMN "target_user_id" UUID;

UPDATE "quests"
SET
    "issuer_user_id" = "user_id",
    "target_user_id" = "user_id"
WHERE "issuer_user_id" IS NULL
   OR "target_user_id" IS NULL;

ALTER TABLE "quests"
ALTER COLUMN "issuer_user_id" SET NOT NULL,
ALTER COLUMN "target_user_id" SET NOT NULL;
