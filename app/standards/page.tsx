import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SubjectGradeFilter } from "@/app/components/SubjectGradeFilter";

export const metadata = { title: "Estándares · simplicityCurr" };

export default async function StandardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const subjectCode = typeof sp.subject === "string" ? sp.subject : undefined;
  const gradeLabel = typeof sp.grade === "string" ? sp.grade : undefined;

  const [subjects, grades] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
  ]);

  const standards = await prisma.standard.findMany({
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
  });

  // Group: subject → grade → standards[]
  const bySubject = new Map<string, { subject: (typeof standards)[0]["subject"]; byGrade: Map<string, typeof standards> }>();
  for (const std of standards) {
    if (!bySubject.has(std.subjectId)) {
      bySubject.set(std.subjectId, { subject: std.subject, byGrade: new Map() });
    }
    const entry = bySubject.get(std.subjectId)!;
    const gl = std.grade.label;
    if (!entry.byGrade.has(gl)) entry.byGrade.set(gl, []);
    entry.byGrade.get(gl)!.push(std);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Estándares y expectativas del DEPR
        </h1>
      </div>

      <div className="mb-8">
        <SubjectGradeFilter
          subjects={subjects}
          grades={grades}
          current={{ subject: subjectCode, grade: gradeLabel }}
          basePath="/standards"
        />
      </div>

      {standards.length === 0 && (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900">
          {subjectCode || gradeLabel
            ? "No hay estándares para este filtro. Prueba otro."
            : "Aún no hay estándares cargados. Corre npm run db:seed o usa npm run ingest."}
        </p>
      )}

      {[...bySubject.values()].map(({ subject, byGrade }) => (
        <section key={subject.id} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {subject.name}{" "}
            <span className="text-sm font-normal text-zinc-400">({subject.code})</span>
          </h2>

          {[...byGrade.entries()].map(([grade, stds]) => (
            <div key={grade} className="mb-6">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-indigo-600">
                Grado {grade}
              </h3>
              <ul className="space-y-4">
                {stds.map((std) => (
                  <li
                    key={std.id}
                    className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      <span className="mr-2 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {std.code}
                      </span>
                      {std.description}
                    </p>
                    <ul className="mt-3 space-y-2 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
                      {std.expectations.map((exp) => (
                        <li key={exp.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="mr-2 font-mono text-xs text-zinc-400">{exp.code}</span>
                          {exp.description}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
