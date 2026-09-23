"use client";

import { useState } from "react";
import { Info } from "lucide-react";

const FORMAT_INFO: Record<string, { label: string; desc: string }> = {
  ICAP: {
    label: "ICAP",
    desc: "Introducción → Construcción → Aplicación → Presentación. Estructura de 4 fases que guía al estudiante desde el conocimiento previo hasta demostrar lo aprendido.",
  },
  WARMUP: {
    label: "Warm Up",
    desc: "Lección corta de calentamiento o repaso rápido al inicio de la clase. Ideal para activar conocimientos previos en 10–15 minutos.",
  },
  "5E": {
    label: "5E",
    desc: "Enganchar → Explorar → Explicar → Elaborar → Evaluar. Modelo constructivista de 5 etapas, especialmente efectivo en ciencias.",
  },
  INQUIRY: {
    label: "Indagación",
    desc: "Los estudiantes formulan preguntas, investigan y construyen su propio conocimiento a través de la exploración guiada.",
  },
  UDL: {
    label: "UDL",
    desc: "Diseño Universal para el Aprendizaje. Ofrece múltiples formas de representación y expresión para atender la diversidad del salón.",
  },
};

export function LessonFormFields() {
  const [isWeekly, setIsWeekly] = useState(true);
  const [format, setFormat] = useState("ICAP");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input
        name="title"
        required
        placeholder="Título de la lección / semana"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
      />

      <div className="sm:col-span-2">
        <select
          name="format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {Object.entries(FORMAT_INFO).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {format && FORMAT_INFO[format] && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <Info size={13} className="mt-0.5 shrink-0" />
            {FORMAT_INFO[format].desc}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
        <input
          type="checkbox"
          name="isWeekly"
          value="1"
          checked={isWeekly}
          onChange={(e) => setIsWeekly(e.target.checked)}
          className="h-4 w-4 accent-teal-600"
        />
        Planificación semanal (Lun–Vie)
      </label>

      {!isWeekly && (
        <input
          name="durationMinutes"
          type="number"
          min="1"
          placeholder="Duración (min)"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      )}
      <input
        name="weekNumber"
        type="number"
        min="1"
        placeholder="Semana #"
        className={`rounded-lg border border-zinc-300 px-3 py-2 text-sm ${!isWeekly ? "" : "sm:col-span-2"}`}
      />
    </div>
  );
}
