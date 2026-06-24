"use client";

import { useRouter } from "next/navigation";

type Subject = { id: string; code: string; name: string };
type Grade = { id: string; label: string };

type Props = {
  subjects: Subject[];
  grades: Grade[];
  current: { subject?: string; grade?: string };
  basePath: string;
};

export function SubjectGradeFilter({ subjects, grades, current, basePath }: Props) {
  const router = useRouter();

  const nav = (subject: string, grade: string) => {
    const p = new URLSearchParams();
    if (subject) p.set("subject", subject);
    if (grade) p.set("grade", grade);
    const qs = p.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={current.subject ?? ""}
        onChange={(e) => nav(e.target.value, current.grade ?? "")}
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todas las materias</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        value={current.grade ?? ""}
        onChange={(e) => nav(current.subject ?? "", e.target.value)}
        className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todos los grados</option>
        {grades.map((g) => (
          <option key={g.id} value={g.label}>
            Grado {g.label}
          </option>
        ))}
      </select>
      {(current.subject || current.grade) && (
        <a
          href={basePath}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Limpiar ×
        </a>
      )}
    </div>
  );
}
