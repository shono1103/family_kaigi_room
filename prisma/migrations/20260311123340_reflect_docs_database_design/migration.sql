-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('father', 'mother', 'child');

-- CreateTable
CREATE TABLE "family" (
    "id" UUID NOT NULL,
    "family_name" TEXT NOT NULL,
    "currency_mosaic_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_currency_mosaic_id_key" ON "family"("currency_mosaic_id");

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "family_id" UUID,
ADD COLUMN "is_family_owner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'normal';

-- Backfill family rows for existing users.
INSERT INTO "family" ("id", "family_name", "created_at")
SELECT
    "id",
    CONCAT(COALESCE(NULLIF(split_part("email", '@', 1), ''), 'family'), ' family'),
    CURRENT_TIMESTAMP
FROM "users";

-- Backfill user ownership and family relation.
UPDATE "users"
SET
    "family_id" = "id",
    "is_family_owner" = true;

-- Preserve the bootstrap admin account as application admin.
UPDATE "users"
SET "role" = 'admin'
WHERE "email" = 'admin@example.com';

-- Enforce family relation after backfill.
ALTER TABLE "users"
ALTER COLUMN "family_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_family_id_idx" ON "users"("family_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy user_infos.role -> user_infos.family_role.
ALTER TABLE "user_infos"
ADD COLUMN "family_role" "FamilyRole";

UPDATE "user_infos"
SET "family_role" = 'child'
WHERE "family_role" IS NULL;

ALTER TABLE "user_infos"
ALTER COLUMN "family_role" SET NOT NULL;

ALTER TABLE "user_infos"
DROP COLUMN "role";
