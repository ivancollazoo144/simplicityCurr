import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [subjects, grades, standards, expectations] = await Promise.all([
    prisma.subject.count(),
    prisma.grade.count(),
    prisma.standard.count(),
    prisma.expectation.count(),
  ]);

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

      <dl className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Materias", value: subjects },
          { label: "Grados", value: grades },
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
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Cuadernos</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Genéralos con IA desde una unidad (en su página). Export PDF: Tanda 4.
          </p>
        </div>
      </nav>
    </main>
  );
}
