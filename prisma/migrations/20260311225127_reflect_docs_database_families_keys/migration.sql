ALTER TABLE "family" RENAME TO "families";

ALTER INDEX "family_pkey" RENAME TO "families_pkey";
ALTER INDEX "family_currency_mosaic_id_key" RENAME TO "families_currency_mosaic_id_key";

ALTER TABLE "users" RENAME CONSTRAINT "users_family_id_fkey" TO "users_family_id_fkey_old";

ALTER TABLE "families"
ADD COLUMN "symbol_pub_key" TEXT,
ADD COLUMN "symbol_priv_key" TEXT;

UPDATE "families"
SET "currency_mosaic_id" = CONCAT('mosaic-', "id"::text)
WHERE "currency_mosaic_id" IS NULL;

ALTER TABLE "families"
ALTER COLUMN "currency_mosaic_id" SET NOT NULL;

CREATE UNIQUE INDEX "families_symbol_pub_key_key" ON "families"("symbol_pub_key");
CREATE UNIQUE INDEX "families_symbol_priv_key_key" ON "families"("symbol_priv_key");

ALTER TABLE "users"
DROP CONSTRAINT "users_family_id_fkey_old";

ALTER TABLE "users"
ADD CONSTRAINT "users_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
