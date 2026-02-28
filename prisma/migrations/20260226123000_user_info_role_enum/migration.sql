-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'normal');

-- AlterTable
ALTER TABLE "user_infos"
ALTER COLUMN "role" TYPE "UserRole"
USING ("role"::"UserRole");
