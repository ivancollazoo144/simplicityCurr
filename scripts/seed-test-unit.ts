import { prisma } from "../lib/prisma";

async function main() {
  const mat = await prisma.subject.findUnique({ where: { code: "MAT" } });
  const g5 = await prisma.grade.findUnique({ where: { label: "5" } });
  const adminTeacher = await prisma.teacher.findFirst({ where: { role: "admin" } });
  if (!mat || !g5) throw new Error("Subject MAT or Grade 5 not found");
  if (!adminTeacher) throw new Error("Admin teacher not found — run scripts/seed-teacher.ts first");
  const unit = await prisma.unit.create({
    data: {
      code: "MAT-G05-U01",
      teacherId: adminTeacher.id,
      subjectId: mat.id,
      gradeId: g5.id,
      title: "Fracciones y Números Decimales",
      timeframe: "3 semanas",
      order: 0,
    },
  });
  console.log("Created unit:", unit.id, unit.title);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
