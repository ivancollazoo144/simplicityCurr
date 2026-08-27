import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateLessonPlanAction, generateLessonWorkbookAction } from "@/app/lessons/actions";
import { deleteWorkbook } from "@/app/workbooks/actions";
import { type LessonFormat, type LessonPlanContent } from "@/lib/generate";
import GenerateButton from "@/app/components/GenerateButton";
import ActionButtons from "@/app/components/ActionButtons";

const FORMAT_LABELS: Record<LessonFormat, string> = {
  ICAP: "ICAP",
  WARMUP: "Warm Up",
  "5E": "5E",
  INQUIRY: "Indagación",
  UDL: "UDL",
  SEMANAL: "Semanal",
};

const DAY_COLORS: Record<string, string> = {
  Lunes:     "bg-blue-500",
  Martes:    "bg-teal-500",
  Miércoles: "bg-violet-500",
  Jueves:    "bg-amber-500",
  Viernes:   "bg-rose-500",
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      unit: { include: { subject: true, grade: true } },
      expectations: { include: { expectation: { include: { standard: true } } } },
      workbooks: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lesson) notFound();

  const plan = lesson.content as unknown as LessonPlanContent | null;
  const format = (lesson.format as LessonFormat) || "ICAP";
  const hasExpectations = lesson.expectations.length > 0;

  const planText = plan
    ? [
        lesson.title,
        `${lesson.unit.subject.name} · Grado ${lesson.unit.grade.label} · ${FORMAT_LABELS[format]}`,
        "",
        plan.overview ? `NOTA PARA EL MAESTRO\n${plan.overview}` : "",
        plan.objectives.length
          ? `\nOBJETIVOS\n${plan.objectives.map((o) => `• ${o}`).join("\n")}`
          : "",
        plan.materials.length
          ? `\nMATERIALES\n${plan.materials.map((m) => `· ${m}`).join("\n")}`
          : "",
        ...plan.sections.map(
          (s, i) =>
            `\n${i + 1}. ${s.name}${s.durationMinutes ? ` (${s.durationMinutes} min)` : ""}\n${s.content}`,
        ),
        plan.teacherNotes ? `\nNOTAS DEL MAESTRO\n${plan.teacherNotes}` : "",
        plan.assessment ? `\nEVALUACIÓN\n${plan.assessment}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      {/* Encabezado */}
      <div className="mb-8">
        <Link href={`/units/${lesson.unitId}`} className="text-sm text-brand-teal hover:underline">
          ← {lesson.unit.title}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {lesson.title}
          </h1>
          {plan && (
            <ActionButtons
              printUrl={`/lessons/${id}/print`}
              filename={lesson.title.replace(/\s+/g, "_")}
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span>{lesson.unit.subject.name} · Grado {lesson.unit.grade.label}</span>
          {lesson.format && (
            <span className="rounded bg-brand/10 px-2 py-0.5 font-mono text-xs font-medium text-brand">
              {FORMAT_LABELS[format]}
            </span>
          )}
          {lesson.durationMinutes && <span>{lesson.durationMinutes} min</span>}
          {lesson.weekNumber && <span>Semana {lesson.weekNumber}</span>}
          {hasExpectations && (
            <span className="text-xs text-zinc-400">
              {lesson.expectations.length} expectativa(s)
            </span>
          )}
        </div>
      </div>

      {/* Plan de trabajo */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-teal">
            Plan de trabajo
          </h2>
          {hasApiKey && (
            <form action={generateLessonPlanAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <GenerateButton
                label={plan ? "Re-generar plan" : "Generar plan con IA"}
                disabled={!hasExpectations}
                className="rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </form>
          )}
        </div>

        {!plan && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center">
            <p className="text-zinc-500">El plan aún no ha sido generado.</p>
            {!hasExpectations && (
              <p className="mt-1 text-sm text-zinc-400">
                Ve a la{" "}
                <Link href={`/units/${lesson.unitId}?tab=planes`} className="text-brand-teal hover:underline">
                  unidad
                </Link>{" "}
                y asigna expectativas a esta lección primero.
              </p>
            )}
          </div>
        )}

        {plan && (
          <div className="space-y-5">
            {/* Overview */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Nota para el maestro</p>
              <p className="mt-1 leading-relaxed">{plan.overview}</p>
            </div>

            {/* Objetivos y materiales */}
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.objectives.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Objetivos</p>
                  <ul className="space-y-1">
                    {plan.objectives.map((o, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-700">
                        <span className="mt-0.5 shrink-0 text-brand">▸</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.materials.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Materiales</p>
                  <ul className="space-y-1">
                    {plan.materials.map((m, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-700">
                        <span className="mt-0.5 shrink-0 text-zinc-400">·</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Secciones */}
            {format === "SEMANAL" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plan.sections.map((sec, i) => {
                  const dotColor = DAY_COLORS[sec.name] ?? "bg-zinc-400";
                  return (
                    <div key={i} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                        <h3 className="font-semibold text-zinc-900">{sec.name}</h3>
                        {sec.durationMinutes && (
                          <span className="ml-auto text-xs text-zinc-400">{sec.durationMinutes} min</span>
                        )}
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{sec.content}</p>
                        {sec.materials && sec.materials.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                            {sec.materials.map((m, j) => <li key={j}>· {m}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {plan.sections.map((sec, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#1A7A6B" }}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#E8521A" }}>
                        {i + 1}
                      </span>
                      <h3 className="flex-1 font-semibold text-white">{sec.name}</h3>
                      {sec.durationMinutes && (
                        <span className="text-xs text-white/70">{sec.durationMinutes} min</span>
                      )}
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{sec.content}</p>
                      {sec.materials && sec.materials.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-400">
                          {sec.materials.map((m, j) => <li key={j}>· {m}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube */}
            {plan.youtubeResources.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Recursos en YouTube
                </p>
                <ul className="space-y-2">
                  {plan.youtubeResources.map((r, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-red-600 text-xs font-bold text-white">
                        ▶
                      </span>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notas y evaluación */}
            {(plan.teacherNotes || plan.assessment) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {plan.teacherNotes && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Notas del maestro</p>
                    <p className="text-sm leading-relaxed text-zinc-700">{plan.teacherNotes}</p>
                  </div>
                )}
                {plan.assessment && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Evaluación</p>
                    <p className="text-sm leading-relaxed text-zinc-700">{plan.assessment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Cuadernos */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-teal">
            Cuadernos
          </h2>
          {hasApiKey && (
            <form action={generateLessonWorkbookAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <GenerateButton
                label="Generar cuaderno con IA"
                disabled={!plan}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </form>
          )}
        </div>

        {lesson.workbooks.length === 0 ? (
          <p className="text-sm text-zinc-400">Aún no hay cuadernos para esta lección.</p>
        ) : (
          <ul className="space-y-2">
            {lesson.workbooks.map((wb) => (
              <li key={wb.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4">
                <Link href={`/workbooks/${wb.id}`} className="font-medium text-zinc-900 hover:text-brand">
                  {wb.title}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{wb.createdAt.toLocaleDateString("es")}</span>
                  <Link href={`/workbooks/${wb.id}/print`} className="text-xs text-brand-teal hover:underline">
                    PDF
                  </Link>
                  <form action={deleteWorkbook}>
                    <input type="hidden" name="id" value={wb.id} />
                    <button className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                      Eliminar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
