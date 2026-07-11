/*
  Warnings:

  - You are about to drop the column `frequency` on the `Habit` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "frequency",
ADD COLUMN     "frequencyCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "frequencyType" "FrequencyType" NOT NULL DEFAULT 'DAILY';

-- DropEnum
DROP TYPE "Frequency";
