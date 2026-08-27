import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { LessonFormat } from "@/lib/generate";

export const metadata = { title: "Planes de trabajo · simplicityCurr" };

const FORMAT_LABELS: Record<LessonFormat, string> = {
  ICAP: "ICAP",
  WARMUP: "Warm Up",
  "5E": "5E",
  INQUIRY: "Indagación",
  UDL: "UDL",
  SEMANAL: "Semanal",
};

export default async function LessonsPage() {
  const session = await getSession();
  const teacherId = session.teacherId!;

  const units = await prisma.unit.findMany({
    where: { teacherId },
    include: {
      subject: true,
      grade: true,
      lessons: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
        include: {
          expectations: { select: { expectationId: true } },
          workbooks: { select: { id: true } },
        },
      },
    },
    orderBy: [{ subjectId: "asc" }, { gradeId: "asc" }, { order: "asc" }],
  });

  const unitsWithLessons = units.filter((u) => u.lessons.length > 0);
  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0);
  const withPlan = units.reduce(
    (n, u) => n + u.lessons.filter((l) => l.content !== null).length,
    0
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-brand-teal hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Planes de trabajo
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crea y gestiona planes de trabajo en formato ICAP, Warm Up, 5E, Indagación o UDL.
          Los planes se generan con IA alineados a las expectativas del DEPR.
        </p>
      </div>

      {/* Stats */}
      <dl className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Unidades con lecciones", value: unitsWithLessons.length },
          { label: "Total de lecciones", value: totalLessons },
          { label: "Planes generados", value: withPlan },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <dt className="text-xs text-zinc-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-zinc-900">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {totalLessons === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">Aún no hay lecciones creadas.</p>
          <p className="mt-2 text-sm text-zinc-400">
            Ve al{" "}
            <Link href="/curriculum" className="text-brand-teal hover:underline">
              mapa curricular
            </Link>
            , abre una unidad y crea la primera lección desde la sección &quot;Planes de trabajo&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {units
            .filter((u) => u.lessons.length > 0)
            .map((unit) => (
              <section key={unit.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-zinc-900">
                      <span className="font-mono text-xs text-zinc-400 mr-2">{unit.code}</span>
                      {unit.title}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {unit.subject.name} · Grado {unit.grade.label}
                    </p>
                  </div>
                  <Link
                    href={`/units/${unit.id}`}
                    className="text-xs text-brand-teal hover:underline"
                  >
                    + Nueva lección
                  </Link>
                </div>
                <ul className="space-y-2">
                  {unit.lessons.map((lesson) => {
                    const hasPlan = lesson.content !== null;
                    const hasWorkbook = lesson.workbooks.length > 0;
                    return (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className="font-medium text-zinc-900 hover:text-brand"
                          >
                            {lesson.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            {lesson.format && (
                              <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-brand">
                                {FORMAT_LABELS[lesson.format as LessonFormat] ?? lesson.format}
                              </span>
                            )}
                            {lesson.weekNumber && <span>Semana {lesson.weekNumber}</span>}
                            {lesson.durationMinutes && <span>{lesson.durationMinutes} min</span>}
                            <span>{lesson.expectations.length} expectativa(s)</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {hasPlan ? (
                            <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                              plan ✓
                            </span>
                          ) : (
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                              sin plan
                            </span>
                          )}
                          {hasWorkbook && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              cuaderno ✓
                            </span>
                          )}
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                          >
                            {hasPlan ? "Ver plan" : "Crear plan"}
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
