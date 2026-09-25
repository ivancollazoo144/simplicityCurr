"use client";

import { useRouter } from "next/navigation";

interface Grade {
  id: string;
  label: string;
}

export function GradeFilter({
  grades,
  current,
  basePath,
}: {
  grades: Grade[];
  current: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) =>
        router.push(e.target.value ? `${basePath}?grade=${e.target.value}` : basePath)
      }
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
    >
      <option value="">Todos los grados</option>
      {grades.map((g) => (
        <option key={g.id} value={g.id}>
          {g.label === "K" ? "Kinder" : `Grado ${g.label}`}
        </option>
      ))}
    </select>
  );
}
