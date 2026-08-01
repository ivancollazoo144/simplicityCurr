import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateQuizAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export default async function QuizPage() {
  const session = await getSession();
  const teacherId = session.teacherId!;

  const allLessons = await prisma.lesson.findMany({
    where: { unit: { teacherId } },
    include: { unit: { include: { subject: true, grade: true } } },
    orderBy: { order: "asc" },
    take: 50,
  });
  const lessons = allLessons.filter((l) => l.content !== null);

  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Quiz de Selección Múltiple</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera un quiz con clave de respuestas listo para imprimir.
        </p>
      </div>

      <form action={generateQuizAction} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Grado</label>
            <select name="grade" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="">Selecciona…</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>Grado {g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Materia</label>
            <select name="subject" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="">Selecciona…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Tema del quiz</label>
          <input
            type="text"
            name="topic"
            required
            placeholder="Ej: Fracciones equivalentes"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {lessons.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Lección base <span className="font-normal text-zinc-400">(opcional — usa sus expectativas)</span>
            </label>
            <select name="lessonId" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="">Sin lección base</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} — {l.unit.subject.name} Grado {l.unit.grade.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">Número de preguntas</label>
          <div className="mt-2 flex gap-4">
            {[5, 10, 15].map((n) => (
              <label key={n} className="flex items-center gap-2 text-sm">
                <input type="radio" name="questionCount" value={n} defaultChecked={n === 10} /> {n}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Idioma</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="es" defaultChecked /> Español
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="en" /> English
            </label>
          </div>
        </div>

        <GenerateButton label="Generar Quiz" />
      </form>
    </main>
  );
}
