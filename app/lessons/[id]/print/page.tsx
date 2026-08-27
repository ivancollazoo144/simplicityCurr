import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./PrintButton";
import { type LessonFormat, type LessonPlanContent } from "@/lib/generate";

const FORMAT_LABELS: Record<LessonFormat, string> = {
  ICAP: "ICAP",
  WARMUP: "Warm Up",
  "5E": "5E",
  INQUIRY: "Indagación",
  UDL: "UDL",
};

export default async function LessonPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      unit: { include: { subject: true, grade: true } },
      expectations: { include: { expectation: { include: { standard: true } } } },
    },
  });
  if (!lesson) notFound();

  const plan = lesson.content as unknown as LessonPlanContent | null;
  if (!plan) notFound();

  const format = (lesson.format as LessonFormat) || "ICAP";

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white">
      {/* Toolbar — oculto al imprimir */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 shadow-sm">
        <Link href={`/lessons/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← Volver al plan
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Usa &quot;Guardar como PDF&quot; en el diálogo de impresión
          </span>
          <PrintButton />
        </div>
      </div>

      {/* Hoja A4 */}
      <main
        className="mx-auto bg-white text-zinc-900 print:shadow-none"
        style={{
          maxWidth: "210mm",
          padding: "20mm 18mm",
          boxShadow: "0 2px 20px rgba(0,0,0,0.12)",
          minHeight: "297mm",
        }}
      >
        {/* Encabezado */}
        <header className="mb-6 pb-4" style={{ borderBottom: "3px solid #E8521A" }}>
          <div className="flex items-start justify-between gap-4">
            <Image
              src="/logo.png"
              alt="Simplicity Learning Center"
              width={160}
              height={64}
              className="h-14 w-auto object-contain"
            />
            <div className="shrink-0 rounded-lg border-2 px-3 py-2 text-center text-xs" style={{ borderColor: "#E8521A" }}>
              <p className="font-bold" style={{ color: "#E8521A" }}>{FORMAT_LABELS[format]}</p>
              {lesson.durationMinutes && (
                <p className="mt-0.5 text-zinc-500">{lesson.durationMinutes} min</p>
              )}
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-zinc-900">{plan.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-600">
            <span>
              <strong>Materia:</strong> {lesson.unit.subject.name}
            </span>
            <span>
              <strong>Grado:</strong> {lesson.unit.grade.label}
            </span>
            {lesson.weekNumber && (
              <span>
                <strong>Semana:</strong> {lesson.weekNumber}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-10 text-sm">
            <span>Maestro/a: ________________________________</span>
            <span>Fecha: __________________</span>
          </div>
        </header>

        {/* Nota para el maestro */}
        <div className="mb-5 rounded border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm print:bg-amber-50">
          <p className="font-semibold text-amber-800">Nota para el maestro</p>
          <p className="mt-1 leading-relaxed text-amber-900">{plan.overview}</p>
        </div>

        {/* Objetivos y materiales en dos columnas */}
        <div className="mb-5 grid grid-cols-2 gap-6 text-sm">
          {plan.objectives.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Objetivos
              </p>
              <ul className="space-y-1">
                {plan.objectives.map((o, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-indigo-500">▸</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.materials.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Materiales
              </p>
              <ul className="space-y-1">
                {plan.materials.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-zinc-400">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Secciones del plan */}
        <div className="space-y-4">
          {plan.sections.map((sec, i) => (
            <section key={i} className="break-inside-avoid rounded border border-zinc-200">
              {/* Header de la sección */}
              <div className="flex items-center gap-2.5 rounded-t px-4 py-2.5" style={{ backgroundColor: "#1A7A6B" }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#E8521A" }}>
                  {i + 1}
                </span>
                <h2 className="flex-1 text-sm font-bold text-white">{sec.name}</h2>
                {sec.durationMinutes && (
                  <span className="rounded bg-white/20 px-2 py-0.5 text-xs text-white/80">
                    {sec.durationMinutes} min
                  </span>
                )}
              </div>
              {/* Contenido */}
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-800">
                  {sec.content}
                </p>
                {sec.materials && sec.materials.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500">
                    {sec.materials.map((m, j) => (
                      <li key={j}>· {m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Expectativas del DEPR cubiertas */}
        {lesson.expectations.length > 0 && (
          <section className="mt-5 break-inside-avoid rounded border border-zinc-200 p-4 text-xs">
            <p className="mb-2 font-bold uppercase tracking-widest text-zinc-500">
              Expectativas del DEPR cubiertas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lesson.expectations.map((le) => (
                <span
                  key={le.expectation.id}
                  className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-600"
                  title={le.expectation.description}
                >
                  {le.expectation.code}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Recursos en YouTube */}
        {plan.youtubeResources.length > 0 && (
          <section className="mt-5 break-inside-avoid">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Recursos en YouTube
            </p>
            <ul className="space-y-1.5">
              {plan.youtubeResources.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    YT
                  </span>
                  <div>
                    <span className="font-medium">{r.label}</span>
                    <br />
                    <span className="break-all text-xs text-blue-600">{r.url}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notas del maestro y evaluación */}
        {(plan.teacherNotes || plan.assessment) && (
          <div className="mt-5 grid grid-cols-2 gap-4 break-inside-avoid text-sm">
            {plan.teacherNotes && (
              <div className="rounded border border-zinc-200 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Notas del maestro
                </p>
                <p className="leading-relaxed text-zinc-700">{plan.teacherNotes}</p>
              </div>
            )}
            {plan.assessment && (
              <div className="rounded border border-zinc-200 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Evaluación
                </p>
                <p className="leading-relaxed text-zinc-700">{plan.assessment}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t border-zinc-200 pt-3 text-[10px] text-zinc-400 print:mt-6">
          <div className="flex justify-between">
            <span>Simplicity Learning Center · simplicityCurr</span>
            <span>
              {lesson.unit.subject.name} · Grado {lesson.unit.grade.label} · {FORMAT_LABELS[format]}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
