import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Mis grupos · simplicityCurr" };

export default async function ClassesPage() {
  const { teacherId } = await requireSession();

  const classes = await prisma.class.findMany({
    where: { teacherId },
    include: {
      subject: true,
      grade: true,
      _count: { select: { units: true } },
    },
    orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Mis grupos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Grupos asignados por el administrador. Haz clic en un grupo para ver sus planes, trabajos y cuadernos.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="font-medium text-zinc-500">Aún no tienes grupos asignados.</p>
          <p className="mt-1 text-sm text-zinc-400">
            El administrador te asignará grupos pronto. Si crees que hay un error, contáctalo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {classes.map((cls) => (
            <li key={cls.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/classes/${cls.id}`} className="group min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 group-hover:text-brand-teal">
                    {cls.name}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {cls.subject.name} · Grado {cls.grade.label} · {cls._count.units} unidad(es)
                  </p>
                  {cls.description && (
                    <p className="mt-0.5 text-xs text-zinc-400">{cls.description}</p>
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/classes/${cls.id}`}
                    className="rounded-lg bg-brand-teal/10 px-3 py-1.5 text-xs font-medium text-brand-teal hover:bg-brand-teal/20"
                  >
                    Ver grupo →
                  </Link>
                  <Link
                    href={`/curriculum?class=${cls.id}`}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Unidades
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
