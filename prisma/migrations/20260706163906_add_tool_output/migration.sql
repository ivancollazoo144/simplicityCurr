-- CreateTable
CREATE TABLE "ToolOutput" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonId" TEXT,
    "unitId" TEXT,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolOutput_teacherId_idx" ON "ToolOutput"("teacherId");

-- AddForeignKey
ALTER TABLE "ToolOutput" ADD CONSTRAINT "ToolOutput_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolOutput" ADD CONSTRAINT "ToolOutput_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolOutput" ADD CONSTRAINT "ToolOutput_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
