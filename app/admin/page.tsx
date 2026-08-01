import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Administración · simplicityCurr" };

export default async function AdminPage() {
  await requireAdmin();

  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { classes: true, units: true } },
    },
  });

  // Count lessons and plans per teacher via units
  const lessonStats = await prisma.lesson.groupBy({
    by: ["unitId"],
    _count: { id: true },
  });
  const allLessons = await prisma.lesson.findMany({
    select: { unitId: true, content: true },
  });
  const planStats = allLessons.filter((l) => l.content !== null);
  const unitToTeacher = await prisma.unit.findMany({
    select: { id: true, teacherId: true },
  });
  const unitTeacherMap = new Map(unitToTeacher.map((u) => [u.id, u.teacherId]));

  const lessonCountByTeacher = new Map<string, number>();
  const planCountByTeacher = new Map<string, number>();
  for (const row of lessonStats) {
    const tid = unitTeacherMap.get(row.unitId);
    if (tid) lessonCountByTeacher.set(tid, (lessonCountByTeacher.get(tid) ?? 0) + row._count.id);
  }
  for (const row of planStats) {
    const tid = unitTeacherMap.get(row.unitId);
    if (tid) planCountByTeacher.set(tid, (planCountByTeacher.get(tid) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-teal hover:underline">← Inicio</Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Panel de administración</h1>
          <p className="mt-1 text-sm text-zinc-500">Supervisa el trabajo de todos los maestros.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/classes"
            className="rounded-lg bg-brand-teal/10 px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/20"
          >
            Gestionar grupos
          </Link>
          <Link
            href="/admin/teachers"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
          >
            Gestionar maestros
          </Link>
        </div>
      </div>

      {/* Tabla de maestros */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-zinc-600">Maestro</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Rol</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Clases</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Unidades</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Lecciones</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Planes</th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-400">{t.email}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    t.role === "admin"
                      ? "bg-brand/10 text-brand"
                      : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {t.role === "admin" ? "Admin" : "Maestro"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-zinc-700">{t._count.classes}</td>
                <td className="px-4 py-3 text-center text-zinc-700">{t._count.units}</td>
                <td className="px-4 py-3 text-center text-zinc-700">
                  {lessonCountByTeacher.get(t.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${
                    (planCountByTeacher.get(t.id) ?? 0) > 0 ? "text-brand-teal" : "text-zinc-400"
                  }`}>
                    {planCountByTeacher.get(t.id) ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/admin/teachers/${t.id}`}
                    className="text-xs text-brand-teal hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 && (
          <p className="px-4 py-8 text-center text-zinc-400">No hay maestros registrados.</p>
        )}
      </div>
    </main>
  );
}
