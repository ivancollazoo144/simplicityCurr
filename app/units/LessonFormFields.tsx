"use client";

import { useState } from "react";

export function LessonFormFields() {
  const [format, setFormat] = useState("");
  const isSemanal = format === "SEMANAL";

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
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      >
        <option value="">— Formato —</option>
        <option value="SEMANAL">Semanal (Lun–Vie)</option>
        <option value="ICAP">ICAP</option>
        <option value="WARMUP">Warm Up</option>
        <option value="5E">5E</option>
        <option value="INQUIRY">Indagación</option>
        <option value="UDL">UDL</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        {!isSemanal && (
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
          className={`rounded-lg border border-zinc-300 px-3 py-2 text-sm ${isSemanal ? "col-span-2" : ""}`}
        />
      </div>
    </div>
  );
}
