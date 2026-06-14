/*
  Warnings:

  - Added the required column `code` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeframe" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Unit_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("description", "gradeId", "id", "order", "subjectId", "timeframe", "title") SELECT "description", "gradeId", "id", "order", "subjectId", "timeframe", "title" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");
CREATE INDEX "Unit_subjectId_gradeId_idx" ON "Unit"("subjectId", "gradeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
