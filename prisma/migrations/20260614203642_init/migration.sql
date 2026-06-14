-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Standard_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Standard_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expectation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "indicators" JSONB,
    CONSTRAINT "Expectation_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeframe" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Unit_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnitExpectation" (
    "unitId" TEXT NOT NULL,
    "expectationId" TEXT NOT NULL,

    PRIMARY KEY ("unitId", "expectationId"),
    CONSTRAINT "UnitExpectation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UnitExpectation_expectationId_fkey" FOREIGN KEY ("expectationId") REFERENCES "Expectation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "durationMinutes" INTEGER,
    "content" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonExpectation" (
    "lessonId" TEXT NOT NULL,
    "expectationId" TEXT NOT NULL,

    PRIMARY KEY ("lessonId", "expectationId"),
    CONSTRAINT "LessonExpectation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonExpectation_expectationId_fkey" FOREIGN KEY ("expectationId") REFERENCES "Expectation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pages" JSONB,
    "unitId" TEXT,
    "lessonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Workbook_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Workbook_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_label_key" ON "Grade"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_order_key" ON "Grade"("order");

-- CreateIndex
CREATE INDEX "Standard_subjectId_gradeId_idx" ON "Standard"("subjectId", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_subjectId_gradeId_code_key" ON "Standard"("subjectId", "gradeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Expectation_standardId_code_key" ON "Expectation"("standardId", "code");

-- CreateIndex
CREATE INDEX "Unit_subjectId_gradeId_idx" ON "Unit"("subjectId", "gradeId");
