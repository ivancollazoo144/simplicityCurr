import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import PracticaForm from "./PracticaForm";

export const metadata = { title: "Práctica Diferenciada · simplicityCurr" };

export default async function PracticaPage() {
  const { teacherId } = await requireSession();

  const [grades, subjects, rawLessons] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.lesson.findMany({
      where: { unit: { teacherId } },
      orderBy: [{ order: "asc" }],
      select: {
        id:      true,
        title:   true,
        content: true,
        unit: { select: { title: true, subjectId: true, gradeId: true } },
      },
      take: 200,
    }),
  ]);

  // Filter in JS to avoid Prisma 7 Json null filter typing issues
  const lessons = rawLessons
    .filter((l) => l.content !== null)
    .map((l) => ({
      id:        l.id,
      title:     l.title,
      unitTitle: l.unit.title,
      subjectId: l.unit.subjectId,
      gradeId:   l.unit.gradeId,
    }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Herramientas
        </a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Práctica Diferenciada</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera 2 o 3 versiones de una hoja de práctica sobre el mismo tema — mismos
          conceptos, preguntas distintas. Ideal para repartir sin que los estudiantes se copien.
        </p>
      </div>

      <PracticaForm grades={grades} subjects={subjects} lessons={lessons} />
    </main>
  );
}
