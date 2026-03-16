ALTER TABLE "discussions"
ADD COLUMN "family_id" UUID;

UPDATE "discussions" AS d
SET "family_id" = u."family_id"
FROM "users" AS u
WHERE d."user_id" = u."id"
  AND d."family_id" IS NULL;

ALTER TABLE "discussions"
ALTER COLUMN "family_id" SET NOT NULL;

CREATE INDEX "discussions_family_id_idx" ON "discussions"("family_id");

ALTER TABLE "discussions"
ADD CONSTRAINT "discussions_family_id_fkey"
FOREIGN KEY ("family_id") REFERENCES "families"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
