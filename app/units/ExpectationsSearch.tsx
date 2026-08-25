"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

type Exp = {
  id: string;
  code: string;
  description: string;
};

type StdGroup = {
  standard: { id: string; code: string; description: string };
  expectations: Exp[];
};

type Props = {
  groups: StdGroup[];
};

export default function ExpectationsSearch({ groups }: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filtered = q
    ? groups
        .map((g) => {
          const stdMatches =
            g.standard.code.toLowerCase().includes(q) ||
            g.standard.description.toLowerCase().includes(q);
          const filteredExps = g.expectations.filter(
            (e) =>
              e.code.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q),
          );
          if (!stdMatches && filteredExps.length === 0) return null;
          return { ...g, expectations: stdMatches ? g.expectations : filteredExps };
        })
        .filter(Boolean) as StdGroup[]
    : groups;

  const totalExps = filtered.reduce((a, g) => a + g.expectations.length, 0);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-zinc-600">
        Estándares y expectativas — marca las que aplican:
      </p>

      {/* Search */}
      <div className="relative mb-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o descripción…"
          className="w-full rounded-lg border border-zinc-200 py-2 pl-8 pr-8 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-brand focus:ring-1 focus:ring-brand/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {q && (
        <p className="mb-1.5 text-xs text-zinc-400">
          {totalExps === 0
            ? `Sin resultados para "${query}"`
            : `${totalExps} expectativa${totalExps !== 1 ? "s" : ""} encontrada${totalExps !== 1 ? "s" : ""}`}
        </p>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-zinc-400">
            No se encontraron resultados.
          </p>
        ) : (
          filtered.map(({ standard, expectations }, i) => (
            <details
              key={standard.id}
              open={!!q}
              className={i > 0 ? "border-t border-zinc-100" : ""}
            >
              <summary className="flex cursor-pointer items-center gap-2 bg-zinc-50 px-3 py-2 hover:bg-zinc-100">
                <span className="font-mono text-xs text-zinc-400">{standard.code}</span>
                <span className="flex-1 text-xs font-medium text-zinc-700">
                  {standard.description}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">({expectations.length})</span>
              </summary>
              <ul className="divide-y divide-zinc-100">
                {expectations.map((exp) => (
                  <li key={exp.id}>
                    <label className="flex cursor-pointer items-start gap-2 px-4 py-2 hover:bg-zinc-50">
                      <input
                        type="checkbox"
                        name="expectationId"
                        value={exp.id}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-xs text-zinc-700">
                        <span className="font-mono text-zinc-400">{exp.code}</span>{" "}
                        {exp.description}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
