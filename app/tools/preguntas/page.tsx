import { prisma } from "@/lib/prisma";
import { generateComprehensionAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export default async function PreguntasPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Preguntas de Comprensión</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera preguntas literales, inferenciales y críticas sobre cualquier texto.
        </p>
      </div>

      <form action={generateComprehensionAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Texto</label>
          <textarea
            name="text"
            required
            rows={8}
            placeholder="Pega aquí el texto para el cual quieres generar preguntas…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

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
          <label className="block text-sm font-medium text-zinc-700">Número de preguntas</label>
          <div className="mt-2 flex gap-4">
            {[3, 5, 8].map((n) => (
              <label key={n} className="flex items-center gap-2 text-sm">
                <input type="radio" name="questionCount" value={n} defaultChecked={n === 5} /> {n}
              </label>
            ))}
          </div>
        </div>

        <GenerateButton label="Generar Preguntas" />
      </form>
    </main>
  );
}
