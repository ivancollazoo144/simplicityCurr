import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PrintButton } from "@/app/workbooks/[id]/print/PrintButton";
import type {
  RubricContent,
  QuizContent,
  ReportCardContent,
  ParentNoteContent,
  LeveledTextContent,
  ComprehensionContent,
  YoutubeContent,
  RealWorldContent,
  PracticeSetContent,
} from "@/lib/generate";

export default async function ToolOutputPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const output = await prisma.toolOutput.findUnique({ where: { id } });
  if (!output || output.teacherId !== session.teacherId) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl bg-white px-8 py-10 text-black">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href={`/tools/${output.id}`} className="text-sm text-indigo-600 hover:underline">
          ← Volver
        </a>
        <PrintButton />
      </div>

      {/* Header — hidden for practica (each version has its own header) */}
      {output.type !== "practica" && (
        <header className="mb-6 border-b border-zinc-300 pb-4">
          <h1 className="text-2xl font-bold">{output.title}</h1>
          <p className="mt-1 text-xs text-zinc-500">
            {new Date(output.createdAt).toLocaleDateString("es-PR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="mt-3 text-sm text-zinc-700">
            Nombre: ____________________________ &nbsp;&nbsp; Fecha: ______________
          </div>
        </header>
      )}

      {output.type === "rubrica"      && <RubricPrint      content={output.content as unknown as RubricContent} />}
      {output.type === "quiz"         && <QuizPrint         content={output.content as unknown as QuizContent} />}
      {output.type === "boletin"      && <BoletinPrint      content={output.content as unknown as ReportCardContent} />}
      {output.type === "comunicacion" && <ComunicacionPrint content={output.content as unknown as ParentNoteContent} />}
      {output.type === "nivelador"    && <NiveladorPrint    content={output.content as unknown as LeveledTextContent} />}
      {output.type === "preguntas"    && <PreguntasPrint    content={output.content as unknown as ComprehensionContent} />}
      {output.type === "youtube"      && <YoutubePrint      content={output.content as unknown as YoutubeContent} />}
      {output.type === "realworld"    && <RealWorldPrint    content={output.content as unknown as RealWorldContent} />}
      {output.type === "practica"     && <PracticaPrint     content={output.content as unknown as PracticeSetContent} title={output.title} />}
    </main>
  );
}

/* ── Existing print views ──────────────────────────────────────────────── */

function RubricPrint({ content }: { content: RubricContent }) {
  return (
    <div>
      <p className="mb-4 text-sm italic text-zinc-600">{content.objective}</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-zinc-400 bg-zinc-100 px-3 py-2 text-left font-semibold">Criterio</th>
            <th className="border border-zinc-400 bg-zinc-100 px-3 py-2 text-left font-semibold">Excelente</th>
            <th className="border border-zinc-400 bg-zinc-100 px-3 py-2 text-left font-semibold">Satisfactorio</th>
            <th className="border border-zinc-400 bg-zinc-100 px-3 py-2 text-left font-semibold">En desarrollo</th>
            <th className="border border-zinc-400 bg-zinc-100 px-3 py-2 text-left font-semibold">Insuficiente</th>
          </tr>
        </thead>
        <tbody>
          {content.criteria?.map((row, i) => (
            <tr key={i}>
              <td className="border border-zinc-300 px-3 py-2 font-medium">{row.criterion}</td>
              <td className="border border-zinc-300 px-3 py-2">{row.excellent}</td>
              <td className="border border-zinc-300 px-3 py-2">{row.satisfactory}</td>
              <td className="border border-zinc-300 px-3 py-2">{row.developing}</td>
              <td className="border border-zinc-300 px-3 py-2">{row.insufficient}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuizPrint({ content }: { content: QuizContent }) {
  return (
    <>
      <p className="mb-6 text-sm italic">{content.instructions}</p>
      <ol className="space-y-6">
        {content.questions?.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <p className="font-medium">{i + 1}. {q.text}</p>
            <ul className="mt-2 space-y-1 pl-4">
              {(["A", "B", "C", "D"] as const).map((letter) => (
                <li key={letter} className="text-sm">
                  <span className="font-medium">{letter}.</span> {q.options[letter]}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <section className="break-before-page mt-8">
        <h2 className="mb-3 text-lg font-bold">Clave de respuestas</h2>
        <ol className="list-decimal list-inside text-sm space-y-1">
          {content.questions?.map((q, i) => (
            <li key={i}>{q.answer}. {q.options[q.answer]}</li>
          ))}
        </ol>
      </section>
    </>
  );
}

function BoletinPrint({ content }: { content: ReportCardContent }) {
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.comment}</p>;
}

function ComunicacionPrint({ content }: { content: ParentNoteContent }) {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold">Asunto: {content.subject}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.body}</p>
    </div>
  );
}

function NiveladorPrint({ content }: { content: LeveledTextContent }) {
  const levelLabel: Record<string, string> = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" };
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Texto original</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.original}</p>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold">Nivel {levelLabel[content.level] ?? content.level}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.leveled}</p>
      </div>
    </div>
  );
}

function PreguntasPrint({ content }: { content: ComprehensionContent }) {
  const typeLabel: Record<string, string> = { literal: "Literal", inferencial: "Inferencial", critica: "Crítica" };
  return (
    <ol className="space-y-5">
      {content.questions?.map((q, i) => (
        <li key={i} className="break-inside-avoid">
          <p className="font-medium">{i + 1}. {q.question} <span className="text-xs font-normal text-zinc-400">({typeLabel[q.type] ?? q.type})</span></p>
          <div className="mt-2 h-12 border-b border-dashed border-zinc-400" />
        </li>
      ))}
      <section className="break-before-page mt-8">
        <h2 className="mb-3 font-bold">Guía de respuestas (maestro)</h2>
        <ol className="space-y-2 text-sm">
          {content.questions?.map((q, i) => (
            <li key={i}><span className="font-medium">{i + 1}.</span> {q.answer}</li>
          ))}
        </ol>
      </section>
    </ol>
  );
}

/* ── New print views ───────────────────────────────────────────────────── */

function YoutubePrint({ content }: { content: YoutubeContent }) {
  return (
    <div className="space-y-7">
      {content.summary?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Puntos principales</h2>
          <ol className="space-y-1.5 text-sm">
            {content.summary.map((p, i) => (
              <li key={i} className="flex gap-2"><span className="font-semibold text-zinc-500">{i + 1}.</span>{p}</li>
            ))}
          </ol>
        </section>
      )}

      {content.vocabulary?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Vocabulario clave</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-left w-1/3">Término</th>
                <th className="border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-left">Definición</th>
              </tr>
            </thead>
            <tbody>
              {content.vocabulary.map((v, i) => (
                <tr key={i}>
                  <td className="border border-zinc-200 px-3 py-1.5 font-medium">{v.term}</td>
                  <td className="border border-zinc-200 px-3 py-1.5">{v.definition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {content.comprehensionQuestions?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Preguntas de comprensión</h2>
          <ol className="space-y-5 text-sm">
            {content.comprehensionQuestions.map((q, i) => (
              <li key={i} className="break-inside-avoid">
                <p className="font-medium">{i + 1}. {q.question} <span className="text-xs font-normal text-zinc-400 capitalize">({q.level})</span></p>
                <div className="mt-2 h-10 border-b border-dashed border-zinc-400" />
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.discussionQuestions?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Preguntas de discusión</h2>
          <ol className="space-y-2 text-sm">
            {content.discussionQuestions.map((q, i) => (
              <li key={i} className="break-inside-avoid">
                <p>{i + 1}. {q}</p>
                <div className="mt-1.5 h-8 border-b border-dashed border-zinc-300" />
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.activities?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Actividades de extensión</h2>
          <ol className="space-y-3 text-sm">
            {content.activities.map((a, i) => (
              <li key={i} className="break-inside-avoid">
                <p className="font-semibold">{i + 1}. {a.title}</p>
                <p className="mt-0.5 text-zinc-700">{a.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Answer key */}
      {content.comprehensionQuestions?.length > 0 && (
        <section className="break-before-page">
          <h2 className="mb-3 font-bold text-base border-b border-zinc-300 pb-1">Guía de respuestas (maestro)</h2>
          <ol className="space-y-2 text-sm">
            {content.comprehensionQuestions.map((q, i) => (
              <li key={i}><span className="font-medium">{i + 1}.</span> {q.answer}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function RealWorldPrint({ content }: { content: RealWorldContent }) {
  const catLabel: Record<string, string> = {
    aplicacion: "Aplicación", carrera: "Carrera", cotidiano: "Cotidiano",
    ciencia: "Ciencia", comunidad: "Comunidad",
  };
  return (
    <div className="space-y-7">
      {content.hook && (
        <blockquote className="border-l-4 border-zinc-400 pl-4 italic text-zinc-700 text-sm">
          {content.hook}
        </blockquote>
      )}

      {content.examples?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Donde aparece en el mundo</h2>
          <div className="space-y-2 text-sm">
            {content.examples.map((ex, i) => (
              <div key={i} className="break-inside-avoid">
                <p className="font-semibold">{catLabel[ex.category] ?? ex.category}: {ex.title}</p>
                <p className="text-zinc-700">{ex.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.careers?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Carreras que lo usan</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {content.careers.map((c, i) => (
              <div key={i} className="break-inside-avoid">
                <p className="font-semibold">{c.title}</p>
                <p className="text-zinc-700">{c.how}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.everydayConnections?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">En tu vida diaria</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
            {content.everydayConnections.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}

      {content.discussionStarters?.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Preguntas de discusión</h2>
          <ol className="space-y-3 text-sm">
            {content.discussionStarters.map((q, i) => (
              <li key={i} className="break-inside-avoid">
                <p>{i + 1}. {q}</p>
                <div className="mt-1.5 h-8 border-b border-dashed border-zinc-300" />
              </li>
            ))}
          </ol>
        </section>
      )}

      {content.challenge && (
        <section>
          <h2 className="mb-2 font-bold text-base border-b border-zinc-300 pb-1">Reto del mundo real</h2>
          <p className="text-sm text-zinc-800">{content.challenge}</p>
        </section>
      )}
    </div>
  );
}

function PracticaPrint({ content, title }: { content: PracticeSetContent; title: string }) {
  const qTypeLabel: Record<string, string> = {
    multiple_choice: "Selección múltiple",
    fill_blank: "Completa",
    open: "Respuesta abierta",
    true_false: "Verdadero / Falso",
  };

  return (
    <>
      {/* Student worksheets — one page per version */}
      {content.worksheets?.map((ws, wi) => (
        <section key={wi} className={wi > 0 ? "break-before-page" : ""}>
          {/* Per-version header */}
          <header className="mb-5 border-b-2 border-zinc-800 pb-3">
            <div className="flex items-baseline justify-between">
              <h1 className="text-xl font-bold">{ws.title}</h1>
              <span className="rounded border border-zinc-400 px-2 py-0.5 text-xs font-bold tracking-widest">
                VERSIÓN {ws.version}
              </span>
            </div>
            <p className="mt-1 text-sm italic text-zinc-600">{ws.instructions}</p>
            <div className="mt-3 text-sm">
              Nombre: ____________________________ &nbsp;&nbsp;&nbsp; Fecha: ______________
            </div>
          </header>

          {/* Questions */}
          <ol className="space-y-5 text-sm">
            {ws.questions?.map((q, qi) => (
              <li key={qi} className="break-inside-avoid">
                <p className="font-medium leading-snug mb-1">
                  <span className="mr-1">{qi + 1}.</span>
                  {q.layout !== "vertical" && q.question}
                  <span className="ml-2 text-[10px] font-normal text-zinc-400">
                    ({qTypeLabel[q.type] ?? q.type})
                  </span>
                </p>

                {/* Vertical math — monospace box with answer line */}
                {q.layout === "vertical" && (
                  <div className="mt-1 inline-block rounded border border-zinc-300 bg-zinc-50 px-4 py-2">
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre">{q.question}</pre>
                    <div className="mt-1 h-6 border-b-2 border-zinc-800 w-full" />
                  </div>
                )}

                {q.type === "multiple_choice" && q.options && (
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 pl-4">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className="flex items-start gap-1.5">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-400 text-[9px]" />
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {q.type === "true_false" && (
                  <div className="mt-2 flex gap-6 pl-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-400" />
                      Verdadero
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-400" />
                      Falso
                    </label>
                  </div>
                )}

                {q.layout !== "vertical" && (q.type === "fill_blank" || q.type === "open") && (
                  <div className={`mt-2 ${q.type === "open" ? "h-16" : "h-8"} border-b border-dashed border-zinc-400`} />
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* Teacher answer key — one page, all versions */}
      <section className="break-before-page">
        <h2 className="mb-4 text-lg font-bold border-b-2 border-zinc-800 pb-2">
          Clave de respuestas — {title}
        </h2>
        {content.worksheets?.map((ws, wi) => (
          <div key={wi} className={wi > 0 ? "mt-6" : ""}>
            <h3 className="mb-2 font-semibold text-sm uppercase tracking-wide text-zinc-500">
              Versión {ws.version}
            </h3>
            <ol className="space-y-1 text-sm">
              {ws.questions?.map((q, qi) => (
                <li key={qi}>
                  <span className="font-medium">{qi + 1}.</span>{" "}
                  <span className="text-zinc-800">{q.answer}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </>
  );
}
