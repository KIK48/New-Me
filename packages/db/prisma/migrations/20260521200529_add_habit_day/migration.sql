/*
  Warnings:

  - You are about to drop the column `isActive` on the `Habit` table. All the data in the column will be lost.
  - Added the required column `startWeek` to the `Habit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "HabitDay" (
    "habitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNSET',

    PRIMARY KEY ("habitId", "date"),
    CONSTRAINT "HabitDay_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "startWeek" DATETIME NOT NULL,
    "endWeek" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Habit" ("createdAt", "id", "name", "notes", "updatedAt") SELECT "createdAt", "id", "name", "notes", "updatedAt" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HabitDay_date_idx" ON "HabitDay"("date");
