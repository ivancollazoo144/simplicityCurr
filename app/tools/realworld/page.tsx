import { prisma } from "@/lib/prisma";
import { generateRealWorldAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export const metadata = { title: "Conexiones del Mundo Real · simplicityCurr" };

export default async function RealWorldPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">
          ← Herramientas
        </a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Conexiones del Mundo Real</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Escribe el tema que estás enseñando y obtén ejemplos reales, carreras, conexiones
          cotidianas y preguntas de discusión para motivar a tus estudiantes.
        </p>
      </div>

      <form action={generateRealWorldAction} className="space-y-6">
        {/* Tema */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Tema o concepto <span className="text-red-500">*</span>
          </label>
          <input
            name="topic"
            required
            type="text"
            placeholder="Ej: Fracciones, El ciclo del agua, La Revolución Industrial…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Grado + Materia */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Grado <span className="text-red-500">*</span>
            </label>
            <select
              name="grade"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Selecciona…</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  Grado {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Materia <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Selecciona…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contexto adicional */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Contexto adicional{" "}
            <span className="text-xs font-normal text-zinc-400">(opcional)</span>
          </label>
          <textarea
            name="context"
            rows={2}
            placeholder="Ej: Los estudiantes acaban de aprender a sumar fracciones y necesitan ver por qué importa…"
            className="mt-1 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Idioma */}
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

        <GenerateButton label="Generar conexiones" />
      </form>
    </main>
  );
}
