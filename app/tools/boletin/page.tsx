import { prisma } from "@/lib/prisma";
import GenerateButton from "@/app/components/GenerateButton";
import { generateReportCardAction } from "../actions";

export default async function BoletinPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Comentarios de Boletín</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera un comentario profesional listo para copiar al boletín de calificaciones.
        </p>
      </div>

      <form action={generateReportCardAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Nombre del estudiante <span className="font-normal text-zinc-400">(o deja en blanco para usar "el estudiante")</span>
          </label>
          <input
            type="text"
            name="studentName"
            placeholder="Ej: María"
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
          <label className="block text-sm font-medium text-zinc-700">Período / Bimestre</label>
          <select name="period" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option value="1er Bimestre">1er Bimestre</option>
            <option value="2do Bimestre">2do Bimestre</option>
            <option value="3er Bimestre">3er Bimestre</option>
            <option value="4to Bimestre">4to Bimestre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Fortalezas del estudiante</label>
          <textarea
            name="strengths"
            required
            rows={3}
            placeholder="Ej: Participa activamente, demuestra comprensión de fracciones, trabaja bien en equipo"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Áreas a mejorar</label>
          <textarea
            name="areasToImprove"
            rows={3}
            placeholder="Ej: Necesita practicar más la multiplicación de decimales, mejorar presentación escrita"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Idioma del comentario</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="es" defaultChecked /> Español
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="en" /> English
            </label>
          </div>
        </div>

        <GenerateButton label="Generar Comentario" />
      </form>
    </main>
  );
}
