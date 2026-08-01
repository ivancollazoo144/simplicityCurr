import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { adminCreateClass, adminDeleteClass, adminReassignClass } from "./actions";

export const metadata = { title: "Grupos · Admin · simplicityCurr" };

export default async function AdminClassesPage() {
  await requireAdmin();

  const [teachers, subjects, grades, classes] = await Promise.all([
    prisma.teacher.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.class.findMany({
      orderBy: [{ teacher: { name: "asc" } }, { name: "asc" }],
      include: {
        teacher: { select: { id: true, name: true } },
        subject: true,
        grade: true,
        _count: { select: { units: true } },
      },
    }),
  ]);

  // Group classes by teacher
  const byTeacher = new Map<string, { teacherName: string; classes: typeof classes }>();
  for (const cls of classes) {
    const tid = cls.teacher.id;
    if (!byTeacher.has(tid)) byTeacher.set(tid, { teacherName: cls.teacher.name, classes: [] });
    byTeacher.get(tid)!.classes.push(cls);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-brand-teal hover:underline">
          ← Panel admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Grupos por maestro</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Asigna grupos a los maestros. Ellos los verán automáticamente al entrar.
        </p>
      </div>

      {/* ── Crear grupo ─────────────────────────────────────────────────── */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Asignar nuevo grupo</h2>
        </div>
        <form action={adminCreateClass} className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          {/* Nombre */}
          <input
            name="name"
            required
            placeholder="Nombre del grupo (ej. 5to A)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />

          {/* Materia */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Materia</label>
            <select
              name="subjectId"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">— Selecciona —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Grado */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Grado</label>
            <select
              name="gradeId"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">— Selecciona —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>Grado {g.label}</option>
              ))}
            </select>
          </div>

          {/* Maestro */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-500">Asignar a maestro</label>
            <select
              name="teacherId"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">— Selecciona maestro —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <input
            name="description"
            placeholder="Descripción opcional"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />

          <button className="justify-self-start rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand/90 sm:col-span-2">
            Asignar grupo
          </button>
        </form>
      </div>

      {/* ── Grupos por maestro ──────────────────────────────────────────── */}
      {classes.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center text-zinc-400">
          Aún no hay grupos asignados. Crea el primero arriba.
        </p>
      ) : (
        <div className="space-y-6">
          {[...byTeacher.entries()].map(([tid, { teacherName, classes: tClasses }]) => (
            <section key={tid}>
              {/* Teacher header */}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">
                  {teacherName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <h2 className="font-semibold text-zinc-900">{teacherName}</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {tClasses.length} grupo{tClasses.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {tClasses.map((cls, i) => (
                  <div
                    key={cls.id}
                    className={`flex flex-wrap items-center gap-4 px-5 py-3.5 ${
                      i < tClasses.length - 1 ? "border-b border-zinc-100" : ""
                    }`}
                  >
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900">{cls.name}</p>
                      <p className="text-xs text-zinc-400">
                        {cls.subject.name} · Grado {cls.grade.label}
                        {cls.description ? ` · ${cls.description}` : ""}
                        {" · "}{cls._count.units} unidad(es)
                      </p>
                    </div>

                    {/* Reasignar */}
                    <form action={adminReassignClass} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={cls.id} />
                      <select
                        name="teacherId"
                        defaultValue={cls.teacher.id}
                        className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-zinc-700"
                      >
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                        Reasignar
                      </button>
                    </form>

                    {/* Eliminar */}
                    <form action={adminDeleteClass}>
                      <input type="hidden" name="id" value={cls.id} />
                      <button className="rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50">
                        Eliminar
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
