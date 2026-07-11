-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKDAYS', 'THREE_PER_WEEK', 'TWO_PER_WEEK');

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "frequency" "Frequency" NOT NULL DEFAULT 'DAILY';
