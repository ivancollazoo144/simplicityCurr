"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  weeklyData: { week: string; count: number }[];
  monthCoveredCount: number;
  totalExpectations: number;
  monthName: string;
};

export default function MonthlyChart({
  weeklyData,
  monthCoveredCount,
  totalExpectations,
  monthName,
}: Props) {
  const pct =
    totalExpectations > 0
      ? Math.round((monthCoveredCount / totalExpectations) * 100)
      : 0;

  const hasData = weeklyData.some((w) => w.count > 0);

  return (
    <div>
      <div className="mb-1 flex items-end gap-3">
        <span className="text-4xl font-bold text-zinc-900">{monthCoveredCount}</span>
        <span className="mb-1 text-sm text-zinc-500">
          expectativas · {pct}% del total
        </span>
      </div>
      <p className="mb-4 text-xs text-zinc-400 capitalize">{monthName}</p>

      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {hasData ? (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="35%">
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value}`, "Expectativas"]}
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                  border: "1px solid #E5E7EB",
                }}
                cursor={{ fill: "#F4F4F5" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.count > 0 ? "#1A7A6B" : "#E5E7EB"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-zinc-400">
          Aún no hay lecciones creadas este mes.
        </p>
      )}
    </div>
  );
}
