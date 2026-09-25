"use client";

import { useTransition } from "react";
import { updateLessonWeek } from "@/app/lessons/actions";

const WEEKS = Array.from({ length: 36 }, (_, i) => i + 1);

export function WeekPicker({
  lessonId,
  currentWeek,
}: {
  lessonId: string;
  currentWeek: number | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const fd = new FormData();
    fd.set("id", lessonId);
    fd.set("weekNumber", val);
    startTransition(() => updateLessonWeek(fd));
  }

  return (
    <select
      value={currentWeek ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 disabled:opacity-50"
      title="Asignar semana"
    >
      <option value="">Sin semana</option>
      {WEEKS.map((w) => (
        <option key={w} value={w}>
          Sem {w}
        </option>
      ))}
    </select>
  );
}
