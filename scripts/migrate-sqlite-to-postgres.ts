/**
 * Migrates DEPR standards data from dev.db (SQLite) to PostgreSQL.
 * Run after:  npx tsx scripts/seed-teacher.ts  (to create admin)
 * Run as:     npx tsx scripts/migrate-sqlite-to-postgres.ts
 */
import "dotenv/config";
import Database from "better-sqlite3";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const pg = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SQLITE_PATH = path.resolve(process.cwd(), "dev.db");

async function main() {
  const db = new Database(SQLITE_PATH, { readonly: true });

  // 1. Grades
  const grades = db.prepare("SELECT id, label, \"order\" FROM \"Grade\"").all() as {
    id: string; label: string; order: number;
  }[];
  for (const g of grades) {
    await pg.grade.upsert({
      where: { label: g.label },
      update: { order: g.order },
      create: { label: g.label, order: g.order },
    });
  }
  console.log(`✓ Grades: ${grades.length}`);

  // 2. Subjects
  const subjects = db.prepare("SELECT id, code, name FROM \"Subject\"").all() as {
    id: string; code: string; name: string;
  }[];
  for (const s of subjects) {
    await pg.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { code: s.code, name: s.name },
    });
  }
  console.log(`✓ Subjects: ${subjects.length}`);

  // Build ID maps (SQLite IDs → PostgreSQL IDs)
  const pgGrades = await pg.grade.findMany();
  const pgSubjects = await pg.subject.findMany();
  const gradeMap = new Map(pgGrades.map((g) => [g.label, g.id]));
  const subjectMap = new Map(pgSubjects.map((s) => [s.code, s.id]));
  const sqliteGradeLabelById = new Map(grades.map((g) => [g.id, g.label]));
  const sqliteSubjectCodeById = new Map(subjects.map((s) => [s.id, s.code]));

  // 3. Standards
  const standards = db.prepare("SELECT id, subjectId, gradeId, code, description FROM \"Standard\"").all() as {
    id: string; subjectId: string; gradeId: string; code: string; description: string;
  }[];
  const standardIdMap = new Map<string, string>(); // sqlite id → pg id
  for (const s of standards) {
    const pgSubjectId = subjectMap.get(sqliteSubjectCodeById.get(s.subjectId)!);
    const pgGradeId = gradeMap.get(sqliteGradeLabelById.get(s.gradeId)!);
    if (!pgSubjectId || !pgGradeId) continue;
    const std = await pg.standard.upsert({
      where: { subjectId_gradeId_code: { subjectId: pgSubjectId, gradeId: pgGradeId, code: s.code } },
      update: { description: s.description },
      create: { subjectId: pgSubjectId, gradeId: pgGradeId, code: s.code, description: s.description },
    });
    standardIdMap.set(s.id, std.id);
  }
  console.log(`✓ Standards: ${standards.length}`);

  // 4. Expectations
  const expectations = db.prepare("SELECT id, standardId, code, description, indicators FROM \"Expectation\"").all() as {
    id: string; standardId: string; code: string; description: string; indicators: string | null;
  }[];
  const expectationIdMap = new Map<string, string>(); // sqlite id → pg id
  for (const e of expectations) {
    const pgStandardId = standardIdMap.get(e.standardId);
    if (!pgStandardId) continue;
    const indicators = e.indicators ? JSON.parse(e.indicators) : [];
    const exp = await pg.expectation.upsert({
      where: { standardId_code: { standardId: pgStandardId, code: e.code } },
      update: { description: e.description, indicators },
      create: { standardId: pgStandardId, code: e.code, description: e.description, indicators },
    });
    expectationIdMap.set(e.id, exp.id);
  }
  console.log(`✓ Expectations: ${expectations.length}`);

  db.close();
  await pg.$disconnect();
  console.log("\n✅ Migration complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
