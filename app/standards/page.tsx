import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Estándares · simplicityCurr" };

export default async function StandardsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      standards: {
        orderBy: { code: "asc" },
        include: {
          grade: true,
          expectations: { orderBy: { code: "asc" } },
        },
      },
    },
  });

  const withStandards = subjects.filter((s) => s.standards.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Estándares y expectativas del DEPR
        </h1>
      </div>

      {withStandards.length === 0 && (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900">
          Aún no hay estándares cargados. Corre <code>npm run db:seed</code> o usa{" "}
          <code>npm run ingest</code>.
        </p>
      )}

      {withStandards.map((subject) => {
        // Agrupar estándares por grado.
        const byGrade = new Map<string, typeof subject.standards>();
        for (const std of subject.standards) {
          const key = std.grade.label;
          if (!byGrade.has(key)) byGrade.set(key, []);
          byGrade.get(key)!.push(std);
        }

        return (
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
        );
      })}
    </main>
  );
}
