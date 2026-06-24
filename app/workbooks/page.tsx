import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Cuadernos · simplicityCurr" };

export default async function WorkbooksPage() {
  const workbooks = await prisma.workbook.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      unit: { include: { subject: true, grade: true } },
    },
  });

  const groups = new Map<string, typeof workbooks>();
  for (const wb of workbooks) {
    const key = wb.unit
      ? `${wb.unit.subject.name} · Grado ${wb.unit.grade.label}`
      : "Sin unidad";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(wb);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Inicio
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cuadernos generados
          </h1>
          <Link
            href="/curriculum"
            className="mt-0.5 whitespace-nowrap rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Ir al currículo →
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Cuadernos generados con IA. Para crear uno nuevo, abre una unidad en el mapa curricular.
        </p>
      </div>

      {workbooks.length === 0 ? (
        <p className="text-zinc-500">
          Aún no hay cuadernos. Genera uno desde una unidad en el{" "}
          <Link href="/curriculum" className="text-indigo-600 hover:underline">
            mapa curricular
          </Link>
          .
        </p>
      ) : (
        [...groups.entries()].map(([groupTitle, wbs]) => (
          <section key={groupTitle} className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-indigo-600">
              {groupTitle}
            </h2>
            <ul className="space-y-2">
              {wbs.map((wb) => (
                <li
                  key={wb.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    <Link
                      href={`/workbooks/${wb.id}`}
                      className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-50"
                    >
                      {wb.title}
                    </Link>
                    {wb.unit && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        <Link href={`/units/${wb.unit.id}`} className="hover:underline">
                          {wb.unit.title}
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">
                      {wb.createdAt.toLocaleDateString("es")}
                    </span>
                    <Link
                      href={`/workbooks/${wb.id}/print`}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      PDF
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
