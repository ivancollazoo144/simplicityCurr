import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { toggleUnitExpectation } from "@/app/curriculum/actions";
import { generateWorkbookForUnit, deleteWorkbook } from "@/app/workbooks/actions";
import { createLesson, deleteLesson, generateWeekWorkbookAction } from "@/app/lessons/actions";
import type { LessonFormat } from "@/lib/generate";
import ExpectationsSearch from "../ExpectationsSearch";
import { LessonFormFields } from "../LessonFormFields";

const FORMAT_LABELS: Record<LessonFormat, string> = {
  ICAP: "ICAP",
  WARMUP: "Warm Up",
  "5E": "5E",
  INQUIRY: "Indagación",
  UDL: "UDL",
};

type Tab = "planes" | "expectativas" | "cuadernos";

export default async function UnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab: Tab =
    sp.tab === "expectativas" ? "expectativas"
    : sp.tab === "cuadernos" ? "cuadernos"
    : "planes";

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  const session = await getSession();
  const teacherId = session.teacherId!;

  const unit = await prisma.unit.findUnique({
    where: { id, teacherId },
    include: {
      subject: true,
      grade: true,
      expectations: true,
      workbooks: { orderBy: { createdAt: "desc" } },
      lessons: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
        include: {
          expectations: { select: { expectationId: true } },
          workbooks: { select: { id: true } },
        },
      },
    },
  });
  if (!unit) notFound();

  const allExpectations = await prisma.expectation.findMany({
    where: { standard: { subjectId: unit.subjectId, gradeId: unit.gradeId } },
    include: { standard: true },
    orderBy: [{ standard: { code: "asc" } }, { code: "asc" }],
  });
  const mapped = new Set(unit.expectations.map((e) => e.expectationId));

  // Group by standard for both tabs
  const standardsMap = new Map<
    string,
    { standard: (typeof allExpectations)[0]["standard"]; expectations: typeof allExpectations }
  >();
  for (const exp of allExpectations) {
    if (!standardsMap.has(exp.standardId)) {
      standardsMap.set(exp.standardId, { standard: exp.standard, expectations: [] });
    }
    standardsMap.get(exp.standardId)!.expectations.push(exp);
  }

  // Group lessons by week
  const weekMap = new Map<number | null, typeof unit.lessons>();
  for (const lesson of unit.lessons) {
    const key = lesson.weekNumber ?? null;
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(lesson);
  }
  const weeksData = [...weekMap.entries()]
    .sort(([a], [b]) => (a ?? 9999) - (b ?? 9999))
    .map(([week, lessons]) => ({ week, lessons }));

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "planes", label: "Planes de trabajo", badge: unit.lessons.length },
    { key: "expectativas", label: "Expectativas DEPR", badge: mapped.size },
    { key: "cuadernos", label: "Cuadernos", badge: unit.workbooks.length },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      {/* Header */}
      <div className="mb-6">
        <Link href="/curriculum" className="text-sm text-brand-teal hover:underline">
          ← Mapa curricular
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {unit.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-mono text-xs text-zinc-400 mr-2">{unit.code}</span>
          {unit.subject.name} · Grado {unit.grade.label}
          {unit.timeframe ? ` · ${unit.timeframe}` : ""}
        </p>
        {unit.description && (
          <p className="mt-2 text-sm text-zinc-600">{unit.description}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
        {tabs.map(({ key, label, badge }) => (
          <Link
            key={key}
            href={`/units/${id}?tab=${key}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  tab === key
                    ? "bg-brand/15 text-brand"
                    : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Tab: Planes de trabajo ── */}
      {tab === "planes" && (
        <section>
          {weeksData.length === 0 ? (
            <p className="mb-6 text-sm text-zinc-500">Aún no hay lecciones en esta unidad. Crea la primera abajo.</p>
          ) : (
            <div className="mb-6 space-y-4">
              {weeksData.map(({ week, lessons }) => {
                const anyPlan = lessons.some((l) => l.content !== null);
                return (
                  <div
                    key={week ?? "sin-semana"}
                    className="rounded-xl border border-zinc-200 bg-white"
                  >
                    <div className="flex items-center justify-between rounded-t-xl border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                      <div>
                        <span className="text-sm font-semibold text-zinc-800">
                          {week ? `Semana ${week}` : "Sin semana asignada"}
                        </span>
                        <span className="ml-2 text-xs text-zinc-400">
                          {lessons.length} lección{lessons.length !== 1 ? "es" : ""}
                        </span>
                      </div>
                      {hasApiKey && week && (
                        <form action={generateWeekWorkbookAction}>
                          <input type="hidden" name="unitId" value={unit.id} />
                          <input type="hidden" name="weekNumber" value={week} />
                          <button
                            disabled={!anyPlan}
                            title={!anyPlan ? "Genera al menos un plan primero" : undefined}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Cuaderno semanal IA
                          </button>
                        </form>
                      )}
                    </div>
                    <ul className="divide-y divide-zinc-100">
                      {lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link
                              href={`/lessons/${lesson.id}`}
                              className="truncate text-sm font-medium text-zinc-900 hover:text-brand"
                            >
                              {lesson.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                              {lesson.format && (
                                <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-brand">
                                  {FORMAT_LABELS[lesson.format as LessonFormat] ?? lesson.format}
                                </span>
                              )}
                              {lesson.durationMinutes && (
                                <span>{lesson.durationMinutes} min</span>
                              )}
                              <span>{lesson.expectations.length} expectativa(s)</span>
                              {lesson.content !== null && (
                                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-brand">
                                  plan ✓
                                </span>
                              )}
                              {lesson.workbooks.length > 0 && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                                  cuaderno ✓
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {lesson.content !== null && (
                              <Link
                                href={`/lessons/${lesson.id}/print`}
                                target="_blank"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                              >
                                PDF
                              </Link>
                            )}
                            <Link
                              href={`/lessons/${lesson.id}`}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                              {lesson.content !== null ? "Ver plan" : "Crear plan"}
                            </Link>
                            <form action={deleteLesson}>
                              <input type="hidden" name="id" value={lesson.id} />
                              <input type="hidden" name="unitId" value={unit.id} />
                              <button className="rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50">
                                Eliminar
                              </button>
                            </form>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nueva lección form */}
          <div className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-900">Nueva lección</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Completa los campos y marca las expectativas que cubre esta lección.
              </p>
            </div>
            <form action={createLesson} className="px-5 py-4">
              <input type="hidden" name="unitId" value={unit.id} />
              <LessonFormFields />

              {allExpectations.length > 0 && (
                <ExpectationsSearch
                  groups={[...standardsMap.values()].map(({ standard, expectations }) => ({
                    standard: { id: standard.id, code: standard.code, description: standard.description },
                    expectations: expectations.map((e) => ({ id: e.id, code: e.code, description: e.description })),
                  }))}
                />
              )}

              <button
                type="submit"
                className="mt-4 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand/90"
              >
                Crear lección
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ── Tab: Expectativas DEPR ── */}
      {tab === "expectativas" && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {mapped.size} de {allExpectations.length} expectativas asignadas a esta unidad.
            </p>
          </div>

          {allExpectations.length === 0 ? (
            <p className="text-zinc-500">
              No hay expectativas para {unit.subject.name} grado {unit.grade.label}.
            </p>
          ) : (
            <div className="space-y-2">
              {[...standardsMap.values()].map(({ standard, expectations }) => {
                const assignedCount = expectations.filter((e) => mapped.has(e.id)).length;
                return (
                  <details
                    key={standard.id}
                    open={assignedCount > 0}
                    className="rounded-xl border border-zinc-200 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs text-zinc-400">{standard.code}</span>
                        <p className="mt-0.5 text-sm font-medium text-zinc-800">
                          {standard.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          assignedCount > 0
                            ? "bg-brand/15 text-brand"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {assignedCount}/{expectations.length}
                      </span>
                    </summary>
                    <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                      {expectations.map((exp) => {
                        const isOn = mapped.has(exp.id);
                        return (
                          <li
                            key={exp.id}
                            className={`flex items-start justify-between gap-4 px-4 py-3 ${
                              isOn ? "bg-brand/5" : ""
                            }`}
                          >
                            <div className="text-sm">
                              <span className="mr-2 font-mono text-xs text-zinc-400">{exp.code}</span>
                              <span className="text-zinc-800">{exp.description}</span>
                            </div>
                            <form action={toggleUnitExpectation}>
                              <input type="hidden" name="unitId" value={unit.id} />
                              <input type="hidden" name="expectationId" value={exp.id} />
                              <button
                                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                                  isOn
                                    ? "bg-brand text-white hover:bg-brand/90"
                                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                }`}
                              >
                                {isOn ? "Quitar" : "Asignar"}
                              </button>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Cuadernos ── */}
      {tab === "cuadernos" && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {unit.workbooks.length === 0
                ? "Aún no hay cuadernos para esta unidad."
                : `${unit.workbooks.length} cuaderno(s) generado(s).`}
            </p>
            {hasApiKey ? (
              <form action={generateWorkbookForUnit}>
                <input type="hidden" name="unitId" value={unit.id} />
                <button
                  disabled={mapped.size === 0}
                  title={mapped.size === 0 ? "Asigna expectativas primero" : undefined}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generar cuaderno con IA
                </button>
              </form>
            ) : (
              <span className="text-xs text-amber-600">
                Configura <code>ANTHROPIC_API_KEY</code> para generar.
              </span>
            )}
          </div>

          {unit.workbooks.length > 0 && (
            <ul className="space-y-2">
              {unit.workbooks.map((wb) => (
                <li
                  key={wb.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <Link
                    href={`/workbooks/${wb.id}`}
                    className="font-medium text-zinc-900 hover:text-brand"
                  >
                    {wb.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">
                      {wb.createdAt.toLocaleDateString("es")}
                    </span>
                    <Link
                      href={`/workbooks/${wb.id}/print`}
                      className="text-xs text-brand-teal hover:underline"
                    >
                      PDF
                    </Link>
                    <form action={deleteWorkbook}>
                      <input type="hidden" name="id" value={wb.id} />
                      <input type="hidden" name="unitId" value={unit.id} />
                      <button className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
