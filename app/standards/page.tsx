import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import StandardsClient from "./StandardsClient";

export const metadata = { title: "Estándares · simplicityCurr" };

export default async function StandardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const subjectCode = typeof sp.subject === "string" ? sp.subject : undefined;
  const gradeLabel = typeof sp.grade === "string" ? sp.grade : undefined;

  const { teacherId } = await requireSession();

  const [subjects, grades, classes] = await Promise.all([
    prisma.subject.findMany({
      where: { standards: { some: {} } },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.unit.findMany({
      where: {
        teacherId,
        ...(subjectCode ? { subject: { code: subjectCode } } : {}),
        ...(gradeLabel  ? { grade:   { label: gradeLabel  } } : {}),
      },
      orderBy: [{ subjectId: "asc" }, { gradeId: "asc" }, { order: "asc" }],
      include: {
        subject: { select: { name: true } },
        grade:   { select: { label: true } },
      },
    }),
  ]);

  // Fetch standards only when at least one filter is set
  const standards =
    subjectCode || gradeLabel
      ? await prisma.standard.findMany({
          where: {
            ...(subjectCode ? { subject: { code: subjectCode } } : {}),
            ...(gradeLabel ? { grade: { label: gradeLabel } } : {}),
          },
          orderBy: { code: "asc" },
          include: {
            subject: true,
            grade: true,
            expectations: { orderBy: { code: "asc" } },
          },
        })
      : [];

  // Covered = expectativa en cualquier unidad O lección del maestro
  const [unitCovered, lessonCovered] = await Promise.all([
    prisma.unitExpectation.findMany({
      where: { unit: { teacherId } },
      select: { expectationId: true },
      distinct: ["expectationId"],
    }),
    prisma.lessonExpectation.findMany({
      where: { lesson: { unit: { teacherId } } },
      select: { expectationId: true },
      distinct: ["expectationId"],
    }),
  ]);
  const coveredIds = new Set([
    ...unitCovered.map((r) => r.expectationId),
    ...lessonCovered.map((r) => r.expectationId),
  ]);

  // Shape data for the client component
  const stdData = standards.map((std) => ({
    id: std.id,
    code: std.code,
    description: std.description,
    expectations: std.expectations.map((exp) => ({
      id: exp.id,
      code: exp.code,
      description: exp.description,
      covered: coveredIds.has(exp.id),
    })),
  }));

  // Flatten all teacher units with context label for the selector
  const unitData = classes.map((u) => ({
    id: u.id,
    title: u.title,
    label: `${u.subject.name} · Grado ${u.grade.label}`,
  }));

  const subjectLabel = subjects.find((s) => s.code === subjectCode)?.name;
  const gradeInfo = grades.find((g) => g.label === gradeLabel)?.label;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Estándares y expectativas del DEPR
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Selecciona expectativas para crear un plan de trabajo directamente desde aquí.
        </p>
      </div>

      <StandardsClient
        subjects={subjects}
        grades={grades}
        current={{ subject: subjectCode, grade: gradeLabel }}
        standards={stdData}
        units={unitData}
        subjectLabel={subjectLabel}
        gradeLabel={gradeInfo}
      />
    </main>
  );
}
