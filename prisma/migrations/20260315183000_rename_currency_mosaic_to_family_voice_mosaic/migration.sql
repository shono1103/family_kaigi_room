ALTER TABLE "families"
RENAME COLUMN "currency_mosaic_id" TO "family_voice_mosaic_id";

ALTER INDEX "families_currency_mosaic_id_key"
RENAME TO "families_family_voice_mosaic_id_key";
