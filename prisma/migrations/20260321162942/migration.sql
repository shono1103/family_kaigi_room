/*
  Warnings:

  - You are about to drop the column `user_id` on the `discussions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "discussions" DROP CONSTRAINT "discussions_user_id_fkey";

-- DropIndex
DROP INDEX "discussions_user_id_idx";

-- AlterTable
ALTER TABLE "discussions" DROP COLUMN "user_id";
