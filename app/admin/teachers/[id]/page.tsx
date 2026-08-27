import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import type { LessonFormat, LessonPlanContent } from "@/lib/generate";

const FORMAT_LABELS: Record<LessonFormat, string> = {
  ICAP: "ICAP", WARMUP: "Warm Up", "5E": "5E", INQUIRY: "Indagación", UDL: "UDL",
};

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      classes: { include: { subject: true, grade: true } },
      units: {
        include: {
          subject: true,
          grade: true,
          class: true,
          lessons: {
            include: {
              workbooks: { select: { id: true } },
            },
          },
          workbooks: { select: { id: true } },
        },
        orderBy: [{ subjectId: "asc" }, { gradeId: "asc" }, { order: "asc" }],
      },
    },
  });
  if (!teacher) notFound();

  const totalLessons = teacher.units.reduce((n, u) => n + u.lessons.length, 0);
  const totalPlans = teacher.units.reduce(
    (n, u) => n + u.lessons.filter((l) => l.content !== null).length, 0
  );
  const totalWorkbooks = teacher.units.reduce((n, u) => n + u.workbooks.length, 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-brand-teal hover:underline">← Panel admin</Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{teacher.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {teacher.email} ·{" "}
          <span className={teacher.role === "admin" ? "text-brand font-semibold" : "text-zinc-500"}>
            {teacher.role === "admin" ? "Administrador" : "Maestro"}
          </span>
        </p>
      </div>

      {/* Stats */}
      <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Clases", value: teacher.classes.length },
          { label: "Unidades", value: teacher.units.length },
          { label: "Lecciones", value: totalLessons },
          { label: "Planes generados", value: totalPlans },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-brand">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* Clases */}
      {teacher.classes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-teal">Clases</h2>
          <ul className="space-y-2">
            {teacher.classes.map((cls) => (
              <li key={cls.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-zinc-900">{cls.name}</p>
                  <p className="text-xs text-zinc-500">{cls.subject.name} · Grado {cls.grade.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Unidades y lecciones */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-teal">
          Unidades y planes de trabajo
        </h2>
        {teacher.units.length === 0 ? (
          <p className="text-zinc-500">Este maestro aún no tiene unidades.</p>
        ) : (
          <div className="space-y-4">
            {teacher.units.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-zinc-200 bg-white">
                <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 rounded-t-xl">
                  <p className="font-semibold text-zinc-900">{unit.title}</p>
                  <p className="text-xs text-zinc-500">
                    <span className="font-mono text-zinc-400">{unit.code}</span> · {unit.subject.name} · Grado {unit.grade.label}
                    {unit.class && <span> · Clase: {unit.class.name}</span>}
                  </p>
                </div>
                {unit.lessons.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-400">Sin lecciones.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {unit.lessons.map((lesson) => {
                      const hasPlan = lesson.content !== null;
                      return (
                        <li key={lesson.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{lesson.title}</p>
                            <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-zinc-400">
                              {lesson.format && (
                                <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-brand">
                                  {FORMAT_LABELS[lesson.format as LessonFormat] ?? lesson.format}
                                </span>
                              )}
                              {lesson.weekNumber && <span>Semana {lesson.weekNumber}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasPlan ? (
                              <span className="rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-semibold text-brand-teal">
                                plan ✓
                              </span>
                            ) : (
                              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-400">
                                sin plan
                              </span>
                            )}
                            {lesson.workbooks.length > 0 && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                cuaderno ✓
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
