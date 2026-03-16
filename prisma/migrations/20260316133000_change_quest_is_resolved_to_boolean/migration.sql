ALTER TABLE "quests"
ALTER COLUMN "is_resolved" TYPE BOOLEAN
USING LOWER(TRIM("is_resolved")) = 'true';
