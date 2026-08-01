import { prisma } from "@/lib/prisma";
import { generateYouTubeAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

export const metadata = { title: "Lección desde YouTube · simplicityCurr" };

const STEPS = [
  "Abre el video en YouTube.",
  'Haz clic en "…más" debajo del título del video.',
  'Haz clic en "Mostrar transcripción" en el cuadro de descripción.',
  "La transcripción aparecerá a la derecha del video.",
  "Selecciona todo el texto, haz clic derecho y cópialo.",
  "Pégalo en el campo de abajo.",
];

export default async function YouTubePage() {
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
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Lección desde YouTube</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Copia la transcripción de un video de YouTube y genera materiales pedagógicos listos
          para clase: resumen, vocabulario, preguntas de comprensión, discusión y actividades.
        </p>
      </div>

      {/* Why transcript, not URL */}
      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-800">¿Por qué no se usa el enlace directamente?</p>
        <p className="mt-1 text-sm text-amber-700">
          Las políticas de privacidad actualizadas de YouTube no permiten que herramientas de IA
          accedan directamente a sus videos. Por eso necesitas copiar la transcripción manualmente
          y pegarla aquí.
        </p>
      </div>

      {/* How-to instructions */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-zinc-800">
          ¿Cómo obtener la transcripción de YouTube?
        </p>
        <ol className="space-y-2.5">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-teal text-[11px] font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        {/* Tutorial video link */}
        <a
          href="https://www.youtube.com/watch?v=yYzYHnQFSSU"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white text-sm font-bold">
            ▶
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">Ver tutorial en YouTube (español)</p>
            <p className="text-xs text-zinc-500">Cómo ver y copiar la transcripción de un video</p>
          </div>
          <span className="ml-auto text-xs text-zinc-400">↗</span>
        </a>
      </div>

      {/* Form */}
      <form action={generateYouTubeAction} className="space-y-6">
        {/* Título del video (optional context) */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Título del video{" "}
            <span className="text-xs font-normal text-zinc-400">(opcional, para identificarlo después)</span>
          </label>
          <input
            name="videoTitle"
            type="text"
            placeholder="Ej: El sistema solar explicado para niños"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Transcript */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Transcripción del video <span className="text-red-500">*</span>
          </label>
          <textarea
            name="transcript"
            required
            rows={10}
            placeholder="Pega aquí el texto de la transcripción de YouTube…"
            className="mt-1 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2.5 text-sm leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Mientras más completa sea la transcripción, mejores serán los materiales generados.
          </p>
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

        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">Idioma de los materiales</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="es" defaultChecked /> Español
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="language" value="en" /> English
            </label>
          </div>
        </div>

        {/* Qué incluir */}
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            ¿Qué incluir?{" "}
            <span className="text-xs font-normal text-zinc-400">(deja todo marcado para generar completo)</span>
          </label>
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            {[
              { name: "inc_summary",       label: "Puntos principales del video",     desc: "4-6 ideas clave" },
              { name: "inc_vocabulary",    label: "Vocabulario clave",                desc: "6-10 términos con definición" },
              { name: "inc_comprehension", label: "Preguntas de comprensión",         desc: "Literales, inferenciales y críticas" },
              { name: "inc_discussion",    label: "Preguntas de discusión",           desc: "Para debate en clase" },
              { name: "inc_activities",    label: "Actividades de extensión",         desc: "2-3 actividades para practicar" },
            ].map(({ name, label, desc }) => (
              <label key={name} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name={name}
                  defaultChecked
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-brand"
                />
                <span>
                  <span className="text-sm font-medium text-zinc-900">{label}</span>
                  <span className="ml-2 text-xs text-zinc-400">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <GenerateButton label="Generar materiales del video" />
      </form>
    </main>
  );
}
