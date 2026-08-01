import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createTeacher, deleteTeacher, resetTeacherPassword, updateTeacherRole } from "./actions";

export const metadata = { title: "Maestros · Admin · simplicityCurr" };

export default async function TeachersAdminPage() {
  await requireAdmin();

  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { units: true, classes: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-brand-teal hover:underline">← Panel admin</Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Gestión de maestros</h1>
      </div>

      {/* Crear maestro */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Nuevo maestro</h2>
        </div>
        <form action={createTeacher} className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <input name="name" required placeholder="Nombre completo" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="correo@simplicity.edu" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Contraseña temporal" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <select name="role" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="teacher">Maestro</option>
            <option value="admin">Administrador</option>
          </select>
          <button className="justify-self-start rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand/90 sm:col-span-2">
            Crear maestro
          </button>
        </form>
      </div>

      {/* Lista */}
      <ul className="space-y-3">
        {teachers.map((t) => (
          <li key={t.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-900">{t.name}</p>
                <p className="text-sm text-zinc-500">{t.email}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {t._count.classes} clase(s) · {t._count.units} unidad(es) ·{" "}
                  <span className={t.role === "admin" ? "font-semibold text-brand" : "text-zinc-500"}>
                    {t.role === "admin" ? "Administrador" : "Maestro"}
                  </span>
                </p>
              </div>
              <Link href={`/admin/teachers/${t.id}`} className="shrink-0 text-xs text-brand-teal hover:underline">
                Ver →
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
              {/* Cambiar rol */}
              <form action={updateTeacherRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <select name="role" defaultValue={t.role} className="rounded border border-zinc-300 px-2 py-1 text-xs">
                  <option value="teacher">Maestro</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100">
                  Cambiar rol
                </button>
              </form>

              {/* Reset contraseña */}
              <form action={resetTeacherPassword} className="flex items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input name="password" type="password" placeholder="Nueva contraseña" className="rounded border border-zinc-300 px-2 py-1 text-xs w-36" />
                <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100">
                  Reset contraseña
                </button>
              </form>

              {/* Eliminar */}
              <form action={deleteTeacher}>
                <input type="hidden" name="id" value={t.id} />
                <button className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                  Eliminar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
