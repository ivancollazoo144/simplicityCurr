import { prisma } from "@/lib/prisma";
import { generateRubricAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export default async function RubricaPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Generador de Rúbricas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crea una rúbrica de evaluación con 4 niveles alineada a estándares DEPR.
        </p>
      </div>

      <form action={generateRubricAction} className="space-y-6">
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
          <label className="block text-sm font-medium text-zinc-700">Tema o tarea a evaluar</label>
          <input
            type="text"
            name="topic"
            required
            placeholder="Ej: Ensayo descriptivo sobre mi comunidad"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
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

        <GenerateButton label="Generar Rúbrica" />
      </form>
    </main>
  );
}
