import Link from "next/link";
import { requireSession } from "@/lib/session";
import {
  Users,
  GraduationCap,
  FileText,
  BookOpen,
  BookMarked,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const metadata = { title: "Bienvenido · simplicityCurr" };

const STEPS = [
  {
    num: 1,
    icon: Users,
    title: "Crear un grupo",
    desc: "Registra tu clase con materia, grado y nombre del grupo. Esto organiza todo tu trabajo bajo un mismo espacio.",
    href: "/classes",
    cta: "Ir a Grupos →",
    color: "bg-teal-50 text-brand-teal",
    ring: "ring-teal-200",
  },
  {
    num: 2,
    icon: GraduationCap,
    title: "Crear una unidad",
    desc: 'Dentro del grupo, crea una unidad temática (ej. "Fracciones"). Aquí defines el alcance y el tiempo estimado.',
    href: "/curriculum",
    cta: "Ir a Currículo →",
    color: "bg-orange-50 text-brand",
    ring: "ring-orange-200",
  },
  {
    num: 3,
    icon: FileText,
    title: "Crear una lección",
    desc: "Añade una lección dentro de la unidad. Elige el formato de enseñanza: ICAP, 5E, UDL, Indagación o Warm Up.",
    href: "/lessons",
    cta: "Ir a Planificaciones →",
    color: "bg-purple-50 text-purple-700",
    ring: "ring-purple-200",
  },
  {
    num: 4,
    icon: BookOpen,
    title: "Generar con IA",
    desc: "Con un clic, la IA genera el plan de trabajo completo y el cuaderno del estudiante alineado al DEPR.",
    href: "/lessons",
    cta: "Ver mis lecciones →",
    color: "bg-blue-50 text-blue-700",
    ring: "ring-blue-200",
  },
];

export default async function WelcomePage() {
  const session = await requireSession();
  const firstName = session.teacherName?.split(" ")[0] ?? "maestro";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">

      {/* Header */}
      <div className="mb-10 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-brand-teal ring-1 ring-teal-200">
          <CheckCircle size={12} />
          Guía de inicio
        </span>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900">
          ¡Bienvenido, {firstName}!
        </h1>
        <p className="mt-2 text-base text-zinc-500">
          Sigue estos pasos para crear tu primera planificación curricular.
        </p>
      </div>

      {/* Flow indicator */}
      <div className="mb-8 hidden items-center justify-center gap-2 sm:flex">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
              {step.num}
            </span>
            <span className="text-sm font-medium text-zinc-700">{step.title}</span>
            {i < STEPS.length - 1 && (
              <ArrowRight size={14} className="text-zinc-300" />
            )}
          </div>
        ))}
      </div>

      {/* Step cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className={`rounded-2xl border bg-white p-6 ring-1 ${step.ring} relative overflow-hidden`}
          >
            <span className="absolute right-4 top-4 text-6xl font-black text-zinc-50 select-none">
              {step.num}
            </span>
            <div className="relative">
              <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${step.color}`}>
                <step.icon size={18} />
              </span>
              <h2 className="mb-2 text-base font-semibold text-zinc-900">
                {step.title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                {step.desc}
              </p>
              <Link
                href={step.href}
                className="text-sm font-medium text-brand-teal hover:underline"
              >
                {step.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Alternative flow */}
      <div className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200">
            <BookMarked size={18} className="text-zinc-600" />
          </span>
          <div>
            <h2 className="mb-1 text-base font-semibold text-zinc-900">
              Flujo alternativo — desde Estándares DEPR
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-zinc-500">
              Si prefieres partir del currículo oficial, ve a{" "}
              <strong>Estándares DEPR</strong>, filtra por materia y grado,
              selecciona las expectativas que vas a trabajar y haz click en{" "}
              <strong>Crear plan de trabajo →</strong>. La lección se crea
              automáticamente ya enlazada a esas expectativas.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-200">Estándares</span>
              <ArrowRight size={12} />
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-200">Seleccionar expectativas</span>
              <ArrowRight size={12} />
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-200">Crear lección</span>
              <ArrowRight size={12} />
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-zinc-200">Generar con IA</span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
          >
            <BookMarked size={14} />
            Ir a Estándares DEPR
          </Link>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/classes"
          className="rounded-xl bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90"
        >
          Comenzar — Crear mi primer grupo →
        </Link>
        <Link
          href="/reports"
          className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Ir al panel de inicio
        </Link>
      </div>
    </main>
  );
}
