import { prisma } from "@/lib/prisma";
import GenerateButton from "@/app/components/GenerateButton";
import { generateParentNoteAction } from "../actions";

export default async function ComunicacionPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Comunicación con Padres</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera notas y correos profesionales en español para padres y tutores.
        </p>
      </div>

      <form action={generateParentNoteAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nombre del estudiante</label>
          <input
            type="text"
            name="studentName"
            placeholder="Ej: Carlos"
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
          <label className="block text-sm font-medium text-zinc-700">Tipo de mensaje</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { value: "progreso_positivo", label: "Progreso positivo" },
              { value: "preocupacion", label: "Preocupación académica" },
              { value: "citacion", label: "Citación a reunión" },
              { value: "informacion_general", label: "Información general" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 cursor-pointer">
                <input type="radio" name="messageType" value={opt.value} defaultChecked={opt.value === "informacion_general"} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Detalles del mensaje</label>
          <textarea
            name="details"
            required
            rows={4}
            placeholder="Ej: El estudiante ha demostrado gran mejora en la resolución de problemas y completó todos sus proyectos a tiempo este bimestre."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <GenerateButton label="Generar Mensaje" />
      </form>
    </main>
  );
}
