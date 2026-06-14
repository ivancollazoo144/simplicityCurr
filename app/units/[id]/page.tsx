import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toggleUnitExpectation } from "@/app/curriculum/actions";

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { subject: true, grade: true, expectations: true },
  });
  if (!unit) notFound();

  // Todas las expectativas de la misma materia+grado, con su estándar.
  const allExpectations = await prisma.expectation.findMany({
    where: { standard: { subjectId: unit.subjectId, gradeId: unit.gradeId } },
    include: { standard: true },
    orderBy: { code: "asc" },
  });
  const mapped = new Set(unit.expectations.map((e) => e.expectationId));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/curriculum" className="text-sm text-indigo-600 hover:underline">
          ← Mapa curricular
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <span className="mr-2 font-mono text-sm text-zinc-400">{unit.code}</span>
          {unit.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {unit.subject.name} · Grado {unit.grade.label}
          {unit.timeframe ? ` · ${unit.timeframe}` : ""}
        </p>
        {unit.description && <p className="mt-2 text-zinc-600 dark:text-zinc-400">{unit.description}</p>}
      </div>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-indigo-600">
        Expectativas del DEPR ({mapped.size} de {allExpectations.length} asignadas)
      </h2>

      {allExpectations.length === 0 && (
        <p className="text-zinc-500">
          No hay expectativas para {unit.subject.name} grado {unit.grade.label}. Cárgalas primero
          (seed o ingesta).
        </p>
      )}

      <ul className="space-y-2">
        {allExpectations.map((exp) => {
          const isOn = mapped.has(exp.id);
          return (
            <li
              key={exp.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                isOn
                  ? "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="text-sm">
                <span className="mr-2 font-mono text-xs text-zinc-400">{exp.code}</span>
                <span className="text-zinc-800 dark:text-zinc-200">{exp.description}</span>
                <p className="mt-1 text-xs text-zinc-400">{exp.standard.description}</p>
              </div>
              <form action={toggleUnitExpectation}>
                <input type="hidden" name="unitId" value={unit.id} />
                <input type="hidden" name="expectationId" value={exp.id} />
                <button
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium ${
                    isOn
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isOn ? "Quitar" : "Asignar"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
