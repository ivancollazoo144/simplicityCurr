import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { BookOpen, FileText, ClipboardList, ChevronRight, Plus, Printer } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id }, include: { subject: true, grade: true } });
  if (!cls) return {};
  return { title: `${cls.name} · simplicityCurr` };
}

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teacherId } = await requireSession();

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      subject: true,
      grade: true,
      teacher: { select: { id: true } },
    },
  });

  if (!cls || cls.teacher.id !== teacherId) notFound();

  // Fetch all teacher units matching this class's subject + grade (classId may not be set)
  const units = await prisma.unit.findMany({
    where: {
      teacherId,
      subjectId: cls.subjectId,
      gradeId: cls.gradeId,
    },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          workbooks: { select: { id: true, title: true, createdAt: true } },
        },
      },
      workbooks: { select: { id: true, title: true, createdAt: true } },
    },
  });

  // Flatten all lessons from all units
  const allLessons = units.flatMap((u) =>
    u.lessons.map((l) => ({ ...l, unit: u }))
  );

  // All workbooks (unit-level + lesson-level)
  const allWorkbooks = [
    ...units.flatMap((u) =>
      u.workbooks.map((w) => ({ ...w, context: u.title }))
    ),
    ...units.flatMap((u) =>
      u.lessons.flatMap((l) =>
        l.workbooks.map((w) => ({ ...w, context: l.title }))
      )
    ),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const planesLessons = allLessons.filter((l) => l.content !== null);
  const trabajosLessons = allLessons.filter((l) => l.content === null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/classes" className="text-sm text-brand-teal hover:underline">
          ← Mis clases
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{cls.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {cls.subject.name} · Grado {cls.grade.label}
              {cls.description && ` · ${cls.description}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/curriculum?class=${cls.id}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Ver unidades
            </Link>
            <Link
              href={`/lessons?class=${cls.id}`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              + Nueva lección
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{units.length}</span> unidades
          </span>
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{allLessons.length}</span> lecciones
          </span>
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600">
            <span className="font-semibold text-brand-teal">{planesLessons.length}</span> planes generados
          </span>
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600">
            <span className="font-semibold text-brand">{allWorkbooks.length}</span> cuadernos
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── PLANES ─────────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
              <ClipboardList size={15} className="text-brand-teal" />
            </span>
            <h2 className="font-semibold text-zinc-900">Planes de trabajo</h2>
            <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal">
              {planesLessons.length}
            </span>
          </div>

          {planesLessons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
              <p className="text-sm text-zinc-400">
                Aún no tienes planes generados para este grupo.
              </p>
              <Link
                href={`/curriculum?class=${cls.id}`}
                className="mt-2 inline-block text-sm text-brand-teal hover:underline"
              >
                Ir a unidades para generar planes →
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {planesLessons.map((lesson, i) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 ${
                    i < planesLessons.length - 1 ? "border-b border-zinc-100" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-brand-teal">
                    <FileText size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{lesson.title}</p>
                    <p className="text-xs text-zinc-400">
                      {lesson.unit.title}
                      {lesson.format ? ` · ${lesson.format}` : ""}
                      {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal">
                      Planificado
                    </span>
                    {lesson.workbooks.length > 0 && (
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-brand">
                        {lesson.workbooks.length} cuaderno{lesson.workbooks.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-zinc-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── TRABAJOS ────────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
              <FileText size={15} className="text-brand" />
            </span>
            <h2 className="font-semibold text-zinc-900">Trabajos pendientes</h2>
            <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-brand">
              {trabajosLessons.length}
            </span>
          </div>

          {trabajosLessons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
              <p className="text-sm text-zinc-500 font-medium">¡Todas las lecciones tienen plan! 🎉</p>
              <p className="mt-1 text-xs text-zinc-400">
                No hay lecciones pendientes de planificar en este grupo.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {trabajosLessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    i < trabajosLessons.length - 1 ? "border-b border-zinc-100" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                    <FileText size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{lesson.title}</p>
                    <p className="text-xs text-zinc-400">
                      {lesson.unit.title}
                      {lesson.weekNumber ? ` · Semana ${lesson.weekNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">
                      Sin plan
                    </span>
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand/90"
                    >
                      Generar plan
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── CUADERNOS ───────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50">
              <BookOpen size={15} className="text-purple-600" />
            </span>
            <h2 className="font-semibold text-zinc-900">Cuadernos</h2>
            <span className="ml-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
              {allWorkbooks.length}
            </span>
          </div>

          {allWorkbooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
              <p className="text-sm text-zinc-400">
                Aún no hay cuadernos generados para este grupo.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Genera un plan de trabajo primero, luego crea el cuaderno desde la lección.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {allWorkbooks.map((wb, i) => (
                <div
                  key={wb.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    i < allWorkbooks.length - 1 ? "border-b border-zinc-100" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <BookOpen size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{wb.title}</p>
                    <p className="text-xs text-zinc-400">{wb.context}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workbooks/${wb.id}/print`}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      <Printer size={12} />
                      Imprimir
                    </Link>
                    <Link
                      href={`/workbooks/${wb.id}`}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
