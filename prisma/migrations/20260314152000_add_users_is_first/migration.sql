ALTER TABLE "users"
ADD COLUMN "is_first" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users"
SET "is_first" = false;
