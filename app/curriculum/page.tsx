import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createUnit, deleteUnit } from "./actions";

export const metadata = { title: "Currículo · simplicityCurr" };

export default async function CurriculumPage() {
  const [units, subjects, grades] = await Promise.all([
    prisma.unit.findMany({
      orderBy: [{ subjectId: "asc" }, { gradeId: "asc" }, { order: "asc" }],
      include: {
        subject: true,
        grade: true,
        _count: { select: { expectations: true, lessons: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
  ]);

  // Agrupar por "materia · grado".
  const groups = new Map<string, typeof units>();
  for (const u of units) {
    const key = `${u.subject.name} · Grado ${u.grade.label}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(u);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mapa curricular
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Unidades por materia y grado (scope &amp; sequence). Abre una unidad para mapear
          expectativas del DEPR.
        </p>
      </div>

      {/* Crear unidad */}
      <form
        action={createUnit}
        className="mb-10 grid gap-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2"
      >
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50 sm:col-span-2">Nueva unidad</h2>
        <select name="subjectId" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="gradeId" required className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              Grado {g.label}
            </option>
          ))}
        </select>
        <input
          name="title"
          required
          placeholder="Título de la unidad"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 sm:col-span-2"
        />
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 sm:col-span-2"
        />
        <button className="justify-self-start rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Crear unidad
        </button>
      </form>

      {[...groups.entries()].map(([title, us]) => (
        <section key={title} className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-indigo-600">{title}</h2>
          <ul className="space-y-2">
            {us.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <Link href={`/units/${u.id}`} className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-50">
                    <span className="mr-2 font-mono text-xs text-zinc-400">{u.code}</span>
                    {u.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {u._count.expectations} expectativa(s)
                    {u.timeframe ? ` · ${u.timeframe}` : ""}
                  </p>
                </div>
                <form action={deleteUnit}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {units.length === 0 && (
        <p className="text-zinc-500">Aún no hay unidades. Crea la primera arriba.</p>
      )}
    </main>
  );
}
