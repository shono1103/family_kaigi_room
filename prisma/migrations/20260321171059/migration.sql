/*
  Warnings:

  - Added the required column `voice_reward` to the `quests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('personalQuest', 'familyQuest');

-- AlterTable
ALTER TABLE "quests" ADD COLUMN     "evaluation_percent" INTEGER,
ADD COLUMN     "is_rewarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quest_type" "QuestType" NOT NULL DEFAULT 'personalQuest',
ADD COLUMN     "voice_reward" INTEGER NOT NULL;
