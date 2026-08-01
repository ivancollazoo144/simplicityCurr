"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  covered: number;
  inProgress: number;
  notStarted: number;
};

const COLORS = ["#1A7A6B", "#E8521A", "#D1D5DB"];

const LABELS = ["Dominado", "En progreso", "No iniciado"];

export default function DonutChart({ covered, inProgress, notStarted }: Props) {
  const total = covered + inProgress + notStarted;
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

  const data = [
    { name: LABELS[0], value: covered },
    { name: LABELS[1], value: inProgress },
    { name: LABELS[2], value: notStarted },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} expectativas`, name]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px", border: "1px solid #E5E7EB" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-zinc-900">{pct}%</span>
          <span className="text-xs text-zinc-500">Cobertura</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        {[
          { label: "Dominado", value: covered, color: "bg-teal-600" },
          { label: "En progreso", value: inProgress, color: "bg-brand" },
          { label: "No iniciado", value: notStarted, color: "bg-zinc-300" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${color} shrink-0`} />
            <span className="text-zinc-600">{label}</span>
            <span className="ml-auto pl-4 font-medium text-zinc-900">{value}</span>
          </div>
        ))}
        <div className="mt-1 border-t border-zinc-100 pt-2 text-xs text-zinc-400">
          Total: {total} expectativas
        </div>
      </div>
    </div>
  );
}
