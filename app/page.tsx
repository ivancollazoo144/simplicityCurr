import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [subjects, grades, standards, expectations, stdCounts] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.standard.count(),
    prisma.expectation.count(),
    prisma.standard.groupBy({ by: ["subjectId", "gradeId"], _count: { id: true } }),
  ]);

  const countMap = new Map(stdCounts.map((r) => [`${r.subjectId}:${r.gradeId}`, r._count.id]));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Simplicity Learning Center
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Currículo K-12 · simplicityCurr
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Plataforma para maestros: estándares del DEPR estructurados, mapa curricular por materia
          y grado, y generación de cuadernos imprimibles.
        </p>
      </header>

      {/* Stats */}
      <dl className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Materias", value: subjects.length },
          { label: "Grados", value: grades.length },
          { label: "Estándares", value: standards },
          { label: "Expectativas", value: expectations },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <dt className="text-sm text-zinc-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Coverage matrix */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Cobertura de estándares
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-3 py-2 text-left font-medium text-zinc-500">Materia</th>
                {grades.map((g) => (
                  <th key={g.id} className="px-2 py-2 text-center font-medium text-zinc-500">
                    {g.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr
                  key={s.id}
                  className={
                    i < subjects.length - 1
                      ? "border-b border-zinc-100 dark:border-zinc-800"
                      : ""
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
                    {s.name}
                  </td>
                  {grades.map((g) => {
                    const count = countMap.get(`${s.id}:${g.id}`) ?? 0;
                    return (
                      <td key={g.id} className="px-2 py-2 text-center">
                        {count > 0 ? (
                          <Link
                            href={`/standards?subject=${s.code}&grade=${g.label}`}
                            className="inline-flex items-center justify-center rounded bg-indigo-100 px-1.5 py-0.5 font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
                          >
                            {count}
                          </Link>
                        ) : (
                          <span className="text-zinc-200 dark:text-zinc-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Número de estándares cargados por materia y grado. Haz clic en una celda para ver los
          estándares.
        </p>
      </section>

      {/* Nav cards */}
      <nav className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/standards"
          className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Estándares →</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Explora los estándares y expectativas del DEPR por materia y grado.
          </p>
        </Link>
        <Link
          href="/curriculum"
          className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Currículo →</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Mapa curricular: unidades por materia/grado y mapeo de expectativas.
          </p>
        </Link>
        <Link
          href="/workbooks"
          className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Cuadernos →</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cuadernos generados con IA. Genera nuevos desde una unidad del currículo.
          </p>
        </Link>
      </nav>
    </main>
  );
}
