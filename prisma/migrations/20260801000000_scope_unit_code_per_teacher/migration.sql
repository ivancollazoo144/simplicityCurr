-- DropIndex
DROP INDEX IF EXISTS "Unit_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Unit_teacherId_code_key" ON "Unit"("teacherId", "code");
