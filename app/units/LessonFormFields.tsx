"use client";

import { useState } from "react";

export function LessonFormFields() {
  const [isWeekly, setIsWeekly] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input
        name="title"
        required
        placeholder="Título de la lección / semana"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
      />

      <select
        name="format"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="">— Formato —</option>
        <option value="ICAP">ICAP</option>
        <option value="WARMUP">Warm Up</option>
        <option value="5E">5E</option>
        <option value="INQUIRY">Indagación</option>
        <option value="UDL">UDL</option>
      </select>

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
