import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteToolOutputAction } from "../actions";
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
import { CopyButton } from "./CopyButton";
import ActionButtons from "@/app/components/ActionButtons";



export default async function ToolOutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const output = await prisma.toolOutput.findUnique({ where: { id } });
  if (!output || output.teacherId !== session.teacherId) notFound();

  const typeLabels: Record<string, string> = {
    rubrica: "Rúbrica",
    quiz: "Quiz",
    boletin: "Comentario de Boletín",
    comunicacion: "Comunicación con Padres",
    nivelador: "Texto Nivelado",
    preguntas: "Preguntas de Comprensión",
    youtube: "Lección desde YouTube",
    realworld: "Mundo Real",
    practica: "Práctica Diferenciada",
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {typeLabels[output.type] ?? output.type}
            </span>
            <h1 className="text-xl font-bold text-zinc-900">{output.title}</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Generado el {new Date(output.createdAt).toLocaleDateString("es-PR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ActionButtons
            printUrl={`/tools/${output.id}/print`}
            filename={output.title.replace(/\s+/g, "_")}
          />
          <form action={deleteToolOutputAction}>
            <input type="hidden" name="id" value={output.id} />
            <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
              Eliminar
            </button>
          </form>
        </div>
      </div>

      {/* Contenido por tipo */}
      {output.type === "rubrica" && <RubricView content={output.content as unknown as RubricContent} />}
      {output.type === "quiz" && <QuizView content={output.content as unknown as QuizContent} />}
      {output.type === "boletin" && <BoletinView content={output.content as unknown as ReportCardContent} />}
      {output.type === "comunicacion" && <ComunicacionView content={output.content as unknown as ParentNoteContent} />}
      {output.type === "nivelador" && <NiveladorView content={output.content as unknown as LeveledTextContent} />}
      {output.type === "preguntas" && <PreguntasView content={output.content as unknown as ComprehensionContent} />}
      {output.type === "youtube" && <YoutubeView content={output.content as unknown as YoutubeContent} />}
      {output.type === "realworld" && <RealWorldView content={output.content as unknown as RealWorldContent} />}
      {output.type === "practica" && <PracticeSetView content={output.content as unknown as PracticeSetContent} />}
    </main>
  );
}

function RubricView({ content }: { content: RubricContent }) {
  return (
    <div>
      <p className="mb-6 text-sm text-zinc-600 italic">{content.objective}</p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left" style={{ backgroundColor: "#1A7A6B" }}>
              <th className="px-4 py-3 font-semibold text-white">Criterio</th>
              <th className="px-4 py-3 font-semibold text-white">Excelente</th>
              <th className="px-4 py-3 font-semibold text-white">Satisfactorio</th>
              <th className="px-4 py-3 font-semibold text-white">En desarrollo</th>
              <th className="px-4 py-3 font-semibold text-white">Insuficiente</th>
            </tr>
          </thead>
          <tbody>
            {content.criteria?.map((row, i) => (
              <tr key={i} className={`border-b border-zinc-100 ${i % 2 === 0 ? "bg-white" : "bg-zinc-50"}`}>
                <td className="px-4 py-3 font-medium text-zinc-800">{row.criterion}</td>
                <td className="px-4 py-3 text-zinc-600">{row.excellent}</td>
                <td className="px-4 py-3 text-zinc-600">{row.satisfactory}</td>
                <td className="px-4 py-3 text-zinc-600">{row.developing}</td>
                <td className="px-4 py-3 text-zinc-600">{row.insufficient}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuizView({ content }: { content: QuizContent }) {
  return (
    <div>
      <p className="mb-6 text-sm text-zinc-600 italic">{content.instructions}</p>
      <ol className="space-y-6">
        {content.questions?.map((q, i) => (
          <li key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 font-medium text-zinc-900">{i + 1}. {q.text}</p>
            <ul className="space-y-2">
              {(["A", "B", "C", "D"] as const).map((letter) => (
                <li
                  key={letter}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                    q.answer === letter ? "bg-green-50 ring-1 ring-green-300" : "bg-zinc-50"
                  }`}
                >
                  <span className={`shrink-0 rounded font-bold ${q.answer === letter ? "text-green-700" : "text-zinc-500"}`}>
                    {letter}.
                  </span>
                  <span className={q.answer === letter ? "text-green-800" : "text-zinc-700"}>
                    {q.options[letter]}
                    {q.answer === letter && <span className="ml-2 text-xs font-medium text-green-600">✓ Correcta</span>}
                  </span>
                </li>
              ))}
            </ul>
            {q.explanation && (
              <p className="mt-3 text-xs text-zinc-500 border-t border-zinc-100 pt-2">
                <span className="font-medium">Explicación:</span> {q.explanation}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function BoletinView({ content }: { content: ReportCardContent }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{content.comment}</p>
      <div className="mt-6 border-t border-zinc-100 pt-4">
        <CopyButton text={content.comment} />
      </div>
    </div>
  );
}

function ComunicacionView({ content }: { content: ParentNoteContent }) {
  const full = `Asunto: ${content.subject}\n\n${content.body}`;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">Asunto</p>
      <p className="mb-6 text-sm font-medium text-zinc-900">{content.subject}</p>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cuerpo</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{content.body}</p>
      <div className="mt-6 border-t border-zinc-100 pt-4">
        <CopyButton text={full} />
      </div>
    </div>
  );
}

function NiveladorView({ content }: { content: LeveledTextContent }) {
  const levelLabel: Record<string, string> = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" };
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Original</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{content.original}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Nivel {levelLabel[content.level] ?? content.level}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{content.leveled}</p>
        <div className="mt-4 border-t border-zinc-100 pt-3">
          <CopyButton text={content.leveled} />
        </div>
      </div>
    </div>
  );
}

const TYPE_BADGES: Record<string, string> = {
  literal: "bg-blue-100 text-blue-700",
  inferencial: "bg-amber-100 text-amber-700",
  critica: "bg-purple-100 text-purple-700",
};

function PreguntasView({ content }: { content: ComprehensionContent }) {
  return (
    <ol className="space-y-5">
      {content.questions?.map((q, i) => (
        <li key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGES[q.type] ?? "bg-zinc-100 text-zinc-600"}`}>
              {q.type}
            </span>
            <span className="text-xs text-zinc-400">Pregunta {i + 1}</span>
          </div>
          <p className="text-sm font-medium text-zinc-900">{q.question}</p>
          <div className="mt-3 rounded-lg bg-zinc-50 px-4 py-2">
            <p className="text-xs font-medium text-zinc-500">Respuesta esperada</p>
            <p className="mt-1 text-sm text-zinc-700">{q.answer}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}


function YoutubeView({ content }: { content: YoutubeContent }) {
  const videoId = content.videoUrl?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1];
  const levelBadge: Record<string, string> = {
    literal:     "bg-blue-50 text-blue-700",
    inferencial: "bg-purple-50 text-purple-700",
    critica:     "bg-orange-50 text-brand",
  };

  return (
    <div className="space-y-8">
      {/* Video embed */}
      {videoId && (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={content.videoTitle}
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50 px-4 py-2">
            <span className="truncate text-sm font-medium text-zinc-700">{content.videoTitle}</span>
            <a
              href={content.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-brand-teal hover:underline"
            >
              Abrir en YouTube →
            </a>
          </div>
        </div>
      )}

      {/* Summary */}
      {content.summary?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Puntos principales</h2>
          <ul className="space-y-2">
            {content.summary.map((point, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-teal-50 px-4 py-2.5 text-sm text-zinc-800">
                <span className="mt-0.5 shrink-0 font-bold text-brand-teal">{i + 1}.</span>
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vocabulary */}
      {content.vocabulary?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Vocabulario clave</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            {content.vocabulary.map((v, i) => (
              <div
                key={i}
                className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-white" : "bg-zinc-50"} ${i < content.vocabulary.length - 1 ? "border-b border-zinc-100" : ""}`}
              >
                <span className="w-40 shrink-0 font-semibold text-brand-teal text-sm">{v.term}</span>
                <span className="text-sm text-zinc-700">{v.definition}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comprehension questions */}
      {content.comprehensionQuestions?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Preguntas de comprensión</h2>
          <ol className="space-y-4">
            {content.comprehensionQuestions.map((q, i) => (
              <li key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${levelBadge[q.level] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {q.level}
                  </span>
                  <span className="text-xs text-zinc-400">Pregunta {i + 1}</span>
                </div>
                <p className="text-sm font-medium text-zinc-900">{q.question}</p>
                <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Respuesta esperada</p>
                  <p className="mt-0.5 text-sm text-zinc-700">{q.answer}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Discussion */}
      {content.discussionQuestions?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Preguntas de discusión</h2>
          <ul className="space-y-2">
            {content.discussionQuestions.map((q, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800">
                <span className="mt-0.5 shrink-0 text-zinc-300">💬</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Activities */}
      {content.activities?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Actividades de extensión</h2>
          <div className="space-y-3">
            {content.activities.map((a, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="font-semibold text-zinc-900 text-sm">
                  <span className="mr-2 text-brand-teal">▸</span>
                  {a.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{a.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  aplicacion: { label: "Aplicación",  color: "bg-teal-50 text-teal-700" },
  carrera:    { label: "Carrera",     color: "bg-blue-50 text-blue-700" },
  cotidiano:  { label: "Cotidiano",   color: "bg-amber-50 text-amber-700" },
  ciencia:    { label: "Ciencia",     color: "bg-purple-50 text-purple-700" },
  comunidad:  { label: "Comunidad",   color: "bg-green-50 text-green-700" },
};

function RealWorldView({ content }: { content: RealWorldContent }) {
  return (
    <div className="space-y-8">
      {/* Hook */}
      {content.hook && (
        <div className="rounded-xl border border-brand-teal/30 bg-teal-50 px-6 py-4">
          <p className="text-base font-semibold leading-relaxed text-zinc-900 italic">"{content.hook}"</p>
        </div>
      )}

      {/* Real-world examples */}
      {content.examples?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Donde aparece en el mundo</h2>
          <div className="space-y-3">
            {content.examples.map((ex, i) => {
              const cat = CATEGORY_LABELS[ex.category] ?? { label: ex.category, color: "bg-zinc-100 text-zinc-600" };
              return (
                <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="font-semibold text-zinc-900 text-sm">{ex.title}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600">{ex.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Careers */}
      {content.careers?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Carreras que lo usan</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {content.careers.map((c, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="font-semibold text-brand-teal text-sm">{c.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{c.how}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Everyday connections */}
      {content.everydayConnections?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">En la vida de tus estudiantes</h2>
          <ul className="space-y-2">
            {content.everydayConnections.map((c, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800">
                <span className="mt-0.5 shrink-0 text-brand-teal">✦</span>
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Discussion starters */}
      {content.discussionStarters?.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Preguntas de discusión</h2>
          <ul className="space-y-2">
            {content.discussionStarters.map((q, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800">
                <span className="mt-0.5 shrink-0 text-zinc-300">💬</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Challenge */}
      {content.challenge && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Reto del mundo real</h2>
          <div className="rounded-xl border-2 border-dashed border-brand-teal/40 bg-teal-50/50 px-6 py-4">
            <p className="text-sm leading-relaxed text-zinc-800">{content.challenge}</p>
          </div>
        </section>
      )}
    </div>
  );
}

const Q_TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Selección múltiple",
  fill_blank:      "Completa",
  open:            "Respuesta abierta",
  true_false:      "Verdadero / Falso",
};

const Q_TYPE_COLOR: Record<string, string> = {
  multiple_choice: "bg-blue-50 text-blue-700",
  fill_blank:      "bg-amber-50 text-amber-700",
  open:            "bg-purple-50 text-purple-700",
  true_false:      "bg-teal-50 text-teal-700",
};

function PracticeSetView({ content }: { content: PracticeSetContent }) {
  return (
    <div className="space-y-10">
      {content.worksheets?.map((ws, wi) => (
        <section key={wi} className="rounded-2xl border-2 border-zinc-200 bg-white overflow-hidden">
          {/* Version header */}
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal text-sm font-bold text-white">
                {ws.version}
              </span>
              <div>
                <p className="font-semibold text-zinc-900">{ws.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{ws.instructions}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-brand-teal">
              Versión {ws.version} · {ws.questions?.length ?? 0} preguntas
            </span>
          </div>

          {/* Questions */}
          <ol className="divide-y divide-zinc-100">
            {ws.questions?.map((q, qi) => (
              <li key={qi} className="px-6 py-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">{qi + 1}.</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${Q_TYPE_COLOR[q.type] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {Q_TYPE_LABEL[q.type] ?? q.type}
                  </span>
                </div>
                {q.layout === "vertical" ? (
                  <pre className="rounded-lg bg-zinc-50 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-900 whitespace-pre">{q.question}</pre>
                ) : (
                  <p className="text-sm font-medium text-zinc-900 leading-relaxed">{q.question}</p>
                )}

                {/* Options for multiple choice */}
                {q.type === "multiple_choice" && q.options && (
                  <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <li
                        key={oi}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          opt.startsWith(q.answer.charAt(0))
                            ? "bg-green-50 text-green-800 ring-1 ring-green-200"
                            : "bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {opt}
                        {opt.startsWith(q.answer.charAt(0)) && (
                          <span className="ml-2 text-xs font-semibold text-green-600">✓</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Answer for non-MC */}
                {q.type !== "multiple_choice" && (
                  <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
                    <span className="text-xs font-medium text-zinc-400">Respuesta: </span>
                    <span className="text-sm text-zinc-700">{q.answer}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
