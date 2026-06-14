import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { WorkbookContent } from "@/lib/generate";

export default async function WorkbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: { unit: { include: { subject: true, grade: true } } },
  });
  if (!workbook) notFound();

  const content = workbook.pages as unknown as WorkbookContent | null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="mb-6">
        {workbook.unit && (
          <Link href={`/units/${workbook.unit.id}`} className="text-sm text-indigo-600 hover:underline">
            ← {workbook.unit.title}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {workbook.title}
        </h1>
        {workbook.unit && (
          <p className="mt-1 text-sm text-zinc-500">
            {workbook.unit.subject.name} · Grado {workbook.unit.grade.label}
          </p>
        )}
      </div>

      {!content || !content.pages?.length ? (
        <p className="text-zinc-500">Este cuaderno no tiene contenido generado.</p>
      ) : (
        <>
          {content.overview && (
            <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {content.overview}
            </p>
          )}
          {content.objectives?.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-indigo-600">Objetivos</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {content.objectives.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}

          {content.pages.map((page, pi) => (
            <section
              key={pi}
              className="mb-6 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                {pi + 1}. {page.title}
              </h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{page.content}</p>

              {page.exercises?.length > 0 && (
                <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
                  {page.exercises.map((ex, ei) => (
                    <li key={ei}>{ex.prompt}</li>
                  ))}
                </ol>
              )}

              {page.exercises?.some((e) => e.answer) && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-indigo-600">Clave de respuestas</summary>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-zinc-500">
                    {page.exercises.map((ex, ei) => (
                      <li key={ei}>{ex.answer}</li>
                    ))}
                  </ol>
                </details>
              )}
            </section>
          ))}
        </>
      )}
    </main>
  );
}
