import { prisma } from "@/lib/prisma";
import { generateLeveledTextAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export default async function NiveladorPage() {
  const [grades, subjects] = await Promise.all([
    prisma.grade.findMany({ orderBy: { order: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8">
        <a href="/tools" className="text-sm text-zinc-400 hover:text-zinc-600">← Herramientas</a>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Nivelador de Texto</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Adapta cualquier texto a nivel básico, intermedio o avanzado para diferenciar la instrucción.
        </p>
      </div>

      <form action={generateLeveledTextAction} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Texto a nivelar</label>
          <textarea
            name="text"
            required
            rows={8}
            placeholder="Pega aquí el texto que quieres adaptar…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Nivel destino</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { value: "basico", label: "Básico", desc: "Vocabulario simple, oraciones cortas" },
              { value: "intermedio", label: "Intermedio", desc: "Apropiado para el grado" },
              { value: "avanzado", label: "Avanzado", desc: "Vocabulario rico, análisis" },
            ].map((opt) => (
              <label key={opt.value} className="flex flex-col gap-1 rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input type="radio" name="targetLevel" value={opt.value} defaultChecked={opt.value === "intermedio"} />
                  <span className="font-medium">{opt.label}</span>
                </div>
                <span className="text-xs text-zinc-400 pl-5">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Grado <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <select name="grade" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="">Ninguno</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>Grado {g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Materia <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <select name="subject" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="">Ninguna</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <GenerateButton label="Nivelar Texto" />
      </form>
    </main>
  );
}
