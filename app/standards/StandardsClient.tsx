"use client";

import { useState, useTransition } from "react";
import { CheckCircle, ClipboardList, X } from "lucide-react";
import { SubjectGradeFilter } from "@/app/components/SubjectGradeFilter";
import { createLessonFromExpectationsAction } from "./actions";

const FORMAT_OPTIONS = [
  { value: "ICAP", label: "ICAP" },
  { value: "5E", label: "5 E's" },
  { value: "UDL", label: "UDL" },
  { value: "INQUIRY", label: "Indagación" },
  { value: "WARMUP", label: "Warm Up" },
] as const;

type ExpData = {
  id: string;
  code: string;
  description: string;
  covered: boolean;
};

type StdData = {
  id: string;
  code: string;
  description: string;
  expectations: ExpData[];
};

type UnitData = {
  id: string;
  title: string;
  label: string; // "Matemáticas · Grado 5"
};

type Subject = { id: string; code: string; name: string };
type Grade = { id: string; label: string };

type Props = {
  subjects: Subject[];
  grades: Grade[];
  current: { subject?: string; grade?: string };
  standards: StdData[];
  units: UnitData[];
  subjectLabel?: string;
  gradeLabel?: string;
};

export default function StandardsClient({
  subjects,
  grades,
  current,
  standards,
  units,
  subjectLabel,
  gradeLabel,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (expIds: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      expIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setPanelOpen(false);
    setError("");
  };

  const handleCreate = (formData: FormData) => {
    selected.forEach((id) => formData.append("expectationId", id));
    setError("");
    startTransition(async () => {
      try {
        await createLessonFromExpectationsAction(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al crear la lección.");
      }
    });
  };

  return (
    <div className="pb-32">
      {/* Filters */}
      <div className="mb-8">
        <SubjectGradeFilter
          subjects={subjects}
          grades={grades}
          current={current}
          basePath="/standards"
        />
      </div>

      {/* Hint */}
      {standards.length > 0 && (
        <p className="mb-4 text-xs text-zinc-400">
          Haz clic en las expectativas para seleccionarlas y crear un plan de trabajo.
          <span className="ml-2 inline-flex items-center gap-1 text-brand-teal">
            <CheckCircle size={11} /> = ya cubierta en tus unidades
          </span>
        </p>
      )}

      {/* Empty state */}
      {standards.length === 0 && (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-600">
          {current.subject || current.grade
            ? "No hay estándares para este filtro."
            : "Selecciona una materia y/o grado para ver sus estándares."}
        </p>
      )}

      {/* Standards list */}
      {standards.map((std) => {
        const stdExpIds = std.expectations.map((e) => e.id);
        const coveredCount = std.expectations.filter((e) => e.covered).length;
        const allCovered = coveredCount === std.expectations.length && std.expectations.length > 0;

        return (
          <div key={std.id} className="mb-6">
            <div
              className={`mb-2 rounded-xl border px-5 py-4 ${
                allCovered ? "border-teal-200 bg-teal-50" : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600">
                      {std.code}
                    </span>
                    {allCovered && (
                      <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-brand-teal">
                        <CheckCircle size={10} /> Cubierto
                      </span>
                    )}
                    {!allCovered && coveredCount > 0 && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        {coveredCount}/{std.expectations.length} cubiertas
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{std.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => selectAll(stdExpIds)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-brand-teal hover:text-brand-teal"
                >
                  Seleccionar todas
                </button>
              </div>

              {/* Expectations */}
              <ul className="mt-3 space-y-1.5 border-l-2 border-zinc-100 pl-4">
                {std.expectations.map((exp) => {
                  const isSelected = selected.has(exp.id);
                  return (
                    <li
                      key={exp.id}
                      onClick={() => toggle(exp.id)}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "bg-brand/10 ring-1 ring-brand/30"
                          : exp.covered
                          ? "bg-teal-50/60 hover:bg-teal-50"
                          : "hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected ? "border-brand bg-brand text-white" : "border-zinc-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="mr-1.5 font-mono text-xs text-zinc-400">{exp.code}</span>
                        <span className={exp.covered ? "text-zinc-600" : "text-zinc-700"}>
                          {exp.description}
                        </span>
                      </div>
                      {exp.covered && (
                        <span title="Ya cubierta en una de tus unidades" className="shrink-0">
                          <CheckCircle size={14} className="text-brand-teal" />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}

      {/* ── Sticky selection bar ─────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <ClipboardList size={16} className="text-brand" />
              </span>
              <span className="text-sm font-medium text-zinc-900">
                {selected.size} expectativa{selected.size > 1 ? "s" : ""} seleccionada{selected.size > 1 ? "s" : ""}
              </span>
              <button onClick={clearSelection} className="text-xs text-zinc-400 hover:text-zinc-700">
                Limpiar ×
              </button>
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Crear plan de trabajo →
            </button>
          </div>
        </div>
      )}

      {/* ── Create plan panel ────────────────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />

          <div className="relative z-50 w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Crear plan de trabajo</h2>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-4 text-xs text-zinc-500">
              {selected.size} expectativa{selected.size > 1 ? "s" : ""} seleccionada{selected.size > 1 ? "s" : ""}
              {subjectLabel ? ` · ${subjectLabel}` : ""}
              {gradeLabel ? ` Grado ${gradeLabel}` : ""}
            </p>

            {units.length === 0 ? (
              <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">
                No tienes unidades creadas aún.{" "}
                <a href="/curriculum" className="text-brand-teal hover:underline">
                  Crear una unidad →
                </a>
              </div>
            ) : (
              <form action={handleCreate} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                    Título de la lección
                  </label>
                  <input
                    name="title"
                    required
                    placeholder="ej. Introducción a las fracciones"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                {/* Unit selector — flat list of ALL teacher units */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                    Unidad
                  </label>
                  <select
                    name="unitId"
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title} — {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Format selector */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                    Formato de la lección
                  </label>
                  <select
                    name="format"
                    required
                    defaultValue="ICAP"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                  >
                    {isPending ? "Creando…" : "Crear lección →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
