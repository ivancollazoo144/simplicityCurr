import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { deleteToolOutputAction } from "./actions";
import ToolRowActions from "./ToolRowActions";

const TOOLS = [
  {
    id: "rubrica",
    name: "Generador de Rúbricas",
    description: "Crea rúbricas de evaluación con 4 niveles alineadas a estándares DEPR.",
    icon: "📋",
    href: "/tools/rubrica",
  },
  {
    id: "quiz",
    name: "Quiz de Selección Múltiple",
    description: "Genera preguntas de opción múltiple con clave de respuestas.",
    icon: "✏️",
    href: "/tools/quiz",
  },
  {
    id: "boletin",
    name: "Comentarios de Boletín",
    description: "Redacta comentarios profesionales para los boletines de calificaciones.",
    icon: "📝",
    href: "/tools/boletin",
  },
  {
    id: "comunicacion",
    name: "Comunicación con Padres",
    description: "Genera notas y correos formales en español para padres y tutores.",
    icon: "✉️",
    href: "/tools/comunicacion",
  },
  {
    id: "nivelador",
    name: "Nivelador de Texto",
    description: "Adapta cualquier texto a nivel básico, intermedio o avanzado.",
    icon: "📖",
    href: "/tools/nivelador",
  },
  {
    id: "preguntas",
    name: "Preguntas de Comprensión",
    description: "Genera preguntas literales, inferenciales y críticas sobre cualquier texto.",
    icon: "💬",
    href: "/tools/preguntas",
  },
  {
    id: "practica",
    name: "Práctica Diferenciada",
    description: "Genera 2 o 3 versiones del mismo trabajo — mismos conceptos, preguntas distintas para cada estudiante.",
    icon: "📄",
    href: "/tools/practica",
  },
  {
    id: "youtube",
    name: "Lección desde YouTube",
    description: "Pega un video de YouTube y obtén resumen, vocabulario, preguntas y actividades listas para clase.",
    icon: "▶️",
    href: "/tools/youtube",
  },
  {
    id: "realworld",
    name: "Conexiones del Mundo Real",
    description: "Conecta cualquier tema de clase con aplicaciones reales, carreras y la vida cotidiana del estudiante.",
    icon: "🌍",
    href: "/tools/realworld",
  },
];

const TYPE_LABELS: Record<string, string> = {
  rubrica: "Rúbrica",
  quiz: "Quiz",
  boletin: "Boletín",
  comunicacion: "Comunicación",
  nivelador: "Nivelador",
  preguntas: "Preguntas",
  practica: "Práctica",
  youtube: "YouTube",
  realworld: "Mundo Real",
};

export default async function ToolsPage() {
  const session = await getSession();
  const teacherId = session.teacherId!;

  const recent = await prisma.toolOutput.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-zinc-900">Herramientas para Maestros</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera rúbricas, quizzes, comentarios y más — alineados al DEPR, en español.
        </p>
      </div>

      {/* Grid de herramientas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <div className="mb-3 text-2xl">{tool.icon}</div>
            <h2 className="text-sm font-semibold text-zinc-900 group-hover:text-brand">{tool.name}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{tool.description}</p>
            <span className="mt-4 text-xs font-medium text-brand">Usar herramienta →</span>
          </Link>
        ))}
      </div>

      {/* Outputs recientes */}
      {recent.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Generados recientemente
          </h2>
          <div className="space-y-2">
            {recent.map((output) => (
              <div
                key={output.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {TYPE_LABELS[output.type] ?? output.type}
                  </span>
                  <Link href={`/tools/${output.id}`} className="text-sm font-medium text-zinc-900 hover:underline">
                    {output.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {new Date(output.createdAt).toLocaleDateString("es-PR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <ToolRowActions id={output.id} title={output.title} />
                  <form action={deleteToolOutputAction}>
                    <input type="hidden" name="id" value={output.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
