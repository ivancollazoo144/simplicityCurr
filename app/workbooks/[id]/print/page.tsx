import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { WorkbookContent } from "@/lib/generate";
import { PrintButton } from "./PrintButton";

export default async function WorkbookPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: { unit: { include: { subject: true, grade: true } } },
  });
  if (!workbook) notFound();

  const content = workbook.pages as unknown as WorkbookContent | null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 bg-white px-8 py-10 text-black">
      {/* Barra de acciones (oculta al imprimir) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href={`/workbooks/${workbook.id}`} className="text-sm text-indigo-600 hover:underline">
          ← Volver al cuaderno
        </a>
        <PrintButton />
      </div>

      {!content || !content.pages?.length ? (
        <p>Este cuaderno no tiene contenido.</p>
      ) : (
        <>
          {/* Encabezado / portada */}
          <header className="mb-6 border-b border-zinc-300 pb-4">
            <h1 className="text-2xl font-bold">{content.title}</h1>
            {workbook.unit && (
              <p className="mt-1 text-sm text-zinc-600">
                {workbook.unit.subject.name} · Grado {workbook.unit.grade.label}
                {workbook.unit.code ? ` · ${workbook.unit.code}` : ""}
              </p>
            )}
            <div className="mt-3 text-sm text-zinc-700">
              Nombre: ____________________________ &nbsp;&nbsp; Fecha: ______________
            </div>
          </header>

          {/* Páginas del cuaderno */}
          {content.pages.map((page, pi) => (
            <section key={pi} className="mb-8 break-after-page">
              <h2 className="mb-2 text-lg font-semibold">
                {pi + 1}. {page.title}
              </h2>
              <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">{page.content}</p>

              {page.exercises?.length > 0 && (
                <ol className="space-y-4 text-sm">
                  {page.exercises.map((ex, ei) => (
                    <li key={ei} className="flex gap-2">
                      <span className="font-medium">{ei + 1}.</span>
                      <div className="flex-1">
                        <p>{ex.prompt}</p>
                        <div className="mt-2 h-8 border-b border-dashed border-zinc-400" />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          {/* Clave de respuestas (para el maestro) */}
          <section className="break-before-page">
            <h2 className="mb-3 text-lg font-bold">Clave de respuestas</h2>
            {content.pages.map((page, pi) => (
              <div key={pi} className="mb-4">
                <h3 className="text-sm font-semibold">
                  {pi + 1}. {page.title}
                </h3>
                <ol className="mt-1 list-inside list-decimal text-sm text-zinc-700">
                  {page.exercises?.map((ex, ei) => (
                    <li key={ei}>{ex.answer}</li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
