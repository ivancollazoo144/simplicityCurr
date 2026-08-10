import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  ChevronRight,
} from "lucide-react";
import MonthlyChart from "./MonthlyChart";

export const metadata = { title: "Reportes · simplicityCurr" };

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 3600) return `Hace ${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `Hace ${Math.floor(secs / 3600)}h`;
  const days = Math.floor(secs / 86400);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
}

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  time: string;
  icon: "workbook" | "tool" | "lesson";
};

export default async function ReportsPage() {
  const { teacherId } = await requireSession();

  // ── Real data ───────────────────────────────────────────────────────────────
  const [classes, allLessons, workbooks, recentWorkbooks, recentTools] =
    await Promise.all([
      prisma.class.findMany({
        where: { teacherId },
        include: {
          subject: true,
          grade: true,
          units: {
            include: {
              lessons: { select: { id: true, content: true } },
              workbooks: { select: { id: true } },
              expectations: { select: { expectationId: true } },
            },
          },
        },
      }),
      prisma.lesson.findMany({
        where: { unit: { teacherId } },
        select: { id: true, content: true },
      }),
      prisma.workbook.findMany({
        where: { OR: [{ unit: { teacherId } }, { lesson: { unit: { teacherId } } }] },
        select: { id: true },
      }),
      prisma.workbook.findMany({
        where: { OR: [{ unit: { teacherId } }, { lesson: { unit: { teacherId } } }] },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { unit: { include: { subject: true } } },
      }),
      prisma.toolOutput.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, type: true, title: true, createdAt: true },
      }),
    ]);

  // Summary counts
  const classCount = classes.length;
  const lessonCount = allLessons.length;
  const plansCount = allLessons.filter((l) => l.content !== null).length;
  const workbookCount = workbooks.length;

  // DEPR coverage: total expectations for teacher's subject/grade combos
  const teacherUnits = await prisma.unit.findMany({
    where: { teacherId },
    select: { subjectId: true, gradeId: true },
  });
  const uniqueCombos = [
    ...new Map(teacherUnits.map((u) => [`${u.subjectId}:${u.gradeId}`, u])).values(),
  ];

  let totalExpectations = 0;
  for (const { subjectId, gradeId } of uniqueCombos) {
    const cnt = await prisma.expectation.count({
      where: { standard: { subjectId, gradeId } },
    });
    totalExpectations += cnt;
  }

  // All-time covered (for card 4)
  const coveredIds = await prisma.unitExpectation.findMany({
    where: { unit: { teacherId } },
    select: { expectationId: true },
    distinct: ["expectationId"],
  });
  const coveredCount = coveredIds.length;
  const coveragePercent =
    totalExpectations > 0 ? Math.round((coveredCount / totalExpectations) * 100) : 0;
  const notStartedCount = Math.max(0, totalExpectations - coveredCount);

  // Monthly DEPR coverage: lessons created this month → their expectations
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString("es-PR", { month: "long", year: "numeric" });

  const monthLessons = await prisma.lesson.findMany({
    where: { unit: { teacherId }, createdAt: { gte: monthStart } },
    select: {
      id: true,
      createdAt: true,
      expectations: { select: { expectationId: true } },
    },
  });

  // Group distinct expectations by week-of-month (1–4)
  const weekExpMap = new Map<number, Set<string>>();
  for (const lesson of monthLessons) {
    const week = Math.min(4, Math.ceil(lesson.createdAt.getDate() / 7));
    if (!weekExpMap.has(week)) weekExpMap.set(week, new Set());
    for (const le of lesson.expectations) {
      weekExpMap.get(week)!.add(le.expectationId);
    }
  }

  const weeklyData = [1, 2, 3, 4].map((w) => ({
    week: `Sem. ${w}`,
    count: weekExpMap.get(w)?.size ?? 0,
  }));

  const allMonthExpIds = new Set(
    monthLessons.flatMap((l) => l.expectations.map((e) => e.expectationId)),
  );
  const monthCoveredCount = allMonthExpIds.size;

  // Per-class stats for the progress table
  type ClassRow = {
    id: string;
    name: string;
    grade: string;
    subject: string;
    coveragePercent: number;
    plansCompleted: number;
    plansTotal: number;
    workbookCount: number;
  };

  const classRows: ClassRow[] = classes.map((cls) => {
    const allClassLessons = cls.units.flatMap((u) => u.lessons);
    const classPlansCompleted = allClassLessons.filter((l) => l.content !== null).length;
    const classWorkbooks = cls.units.flatMap((u) => u.workbooks).length;
    const classExpCovered = cls.units.reduce((acc, u) => acc + u.expectations.length, 0);
    // approximate coverage using max 100%
    const rawCovPct =
      totalExpectations > 0
        ? Math.min(100, Math.round((classExpCovered / (totalExpectations / Math.max(uniqueCombos.length, 1))) * 100))
        : 0;
    return {
      id: cls.id,
      name: cls.name,
      grade: `${cls.grade.label}°`,
      subject: cls.subject.name,
      coveragePercent: rawCovPct,
      plansCompleted: classPlansCompleted,
      plansTotal: allClassLessons.length,
      workbookCount: classWorkbooks,
    };
  });

  // Attention groups: classes with low coverage or incomplete plans
  const attentionGroups = classRows
    .filter((c) => c.coveragePercent < 70 || (c.plansTotal > 0 && c.plansCompleted / c.plansTotal < 0.6))
    .slice(0, 4);

  // Recent activity feed
  const activityItems: ActivityItem[] = [
    ...recentWorkbooks.map((w) => ({
      id: w.id,
      title: w.title,
      meta: w.unit?.subject?.name ?? "Cuaderno",
      time: timeAgo(w.createdAt),
      icon: "workbook" as const,
    })),
    ...recentTools.map((t) => ({
      id: t.id,
      title: t.title,
      meta: t.type,
      time: timeAgo(t.createdAt),
      icon: "tool" as const,
    })),
  ]
    .sort((a, b) => {
      // keep original order from DB (already sorted by createdAt desc per source)
      return 0;
    })
    .slice(0, 6);

  const plansPercent = lessonCount > 0 ? Math.round((plansCount / lessonCount) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Reportes y progreso</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Monitorea la cobertura de estándares DEPR, planes de trabajo y cuadernos generados.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5">
            Año escolar 2025–2026
          </span>
          <Link
            href="/standards"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50"
          >
            Ver estándares →
          </Link>
        </div>
      </div>

      {/* ── Metric cards ───────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1 — Clases */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Clases activas</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <Users size={18} className="text-brand-teal" />
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{classCount}</p>
          <p className="mt-1 text-xs text-zinc-400">Grupos configurados</p>
        </div>

        {/* Card 2 — Planificaciones */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Planes completados</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <FileText size={18} className="text-brand" />
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{plansCount}</p>
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
              <span>{plansPercent}% del total</span>
              <span>{lessonCount} lecciones</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${plansPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3 — Cuadernos */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Cuadernos publicados</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <BookOpen size={18} className="text-brand-teal" />
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{workbookCount}</p>
          <p className="mt-1 text-xs text-zinc-400">Generados con IA</p>
        </div>

        {/* Card 4 — DEPR */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Cobertura DEPR</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
              <BarChart3 size={18} className="text-purple-600" />
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{coveragePercent}%</p>
          <p className="mt-1 text-xs text-zinc-400">
            {coveredCount} de {totalExpectations} expectativas
          </p>
        </div>
      </div>

      {/* ── Row 2: Donut + Activity ─────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Monthly DEPR chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-zinc-900">Cobertura DEPR este mes</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Expectativas trabajadas en lecciones creadas este mes
              </p>
            </div>
            <Link href="/standards" className="text-xs text-brand-teal hover:underline">
              Ver estándares →
            </Link>
          </div>
          <MonthlyChart
            weeklyData={weeklyData}
            monthCoveredCount={monthCoveredCount}
            totalExpectations={totalExpectations}
            monthName={monthName}
          />
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Actividad reciente</h2>
            <Link href="/workbooks" className="text-xs text-brand-teal hover:underline">
              Ver todas →
            </Link>
          </div>

          {activityItems.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-400">
              <Activity size={28} className="text-zinc-200" />
              <p className="text-sm text-center">Aún no hay actividad registrada</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activityItems.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      item.icon === "workbook"
                        ? "bg-teal-50 text-brand-teal"
                        : "bg-orange-50 text-brand"
                    }`}
                  >
                    {item.icon === "workbook" ? (
                      <BookOpen size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="text-xs text-zinc-400">{item.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">{item.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 3: Progress table + Attention ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Group progress table */}
        <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Progreso por clase</h2>
            <Link href="/classes" className="text-xs text-brand-teal hover:underline">
              Ver clases →
            </Link>
          </div>

          {classRows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-zinc-400">
              <Users size={28} className="text-zinc-200" />
              <p className="text-sm text-center">No tienes clases configuradas</p>
              <Link href="/classes" className="text-xs text-brand-teal hover:underline">
                Crear primera clase →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                    <th className="px-6 py-3 font-medium">Clase</th>
                    <th className="px-4 py-3 font-medium">Grado</th>
                    <th className="px-4 py-3 font-medium">Materia</th>
                    <th className="px-4 py-3 font-medium">Cobertura DEPR</th>
                    <th className="px-4 py-3 font-medium">Planes</th>
                    <th className="px-4 py-3 font-medium">Cuadernos</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {classRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                    >
                      <td className="px-6 py-3 font-medium text-zinc-900">{row.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.grade}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.subject}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className={`h-full rounded-full ${
                                row.coveragePercent >= 70 ? "bg-teal-600" : "bg-brand"
                              }`}
                              style={{ width: `${row.coveragePercent}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              row.coveragePercent >= 70 ? "text-teal-700" : "text-brand"
                            }`}
                          >
                            {row.coveragePercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {row.plansCompleted}/{row.plansTotal}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{row.workbookCount}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/classes/${row.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attention groups */}
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Necesitan atención</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Clases con cobertura baja o planes atrasados
            </p>
          </div>

          {attentionGroups.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-zinc-400">
              <CheckCircle size={28} className="text-teal-400" />
              <p className="text-sm">Todo al día. ¡Buen trabajo!</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {attentionGroups.map((cls) => {
                const reason =
                  cls.coveragePercent < 70
                    ? "Cobertura DEPR baja"
                    : "Planes de trabajo atrasados";
                const badge =
                  cls.coveragePercent < 70
                    ? `${cls.coveragePercent}%`
                    : `${cls.plansCompleted}/${cls.plansTotal}`;
                return (
                  <li key={cls.id}>
                    <Link
                      href={`/classes/${cls.id}`}
                      className="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-50/80"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <AlertTriangle size={14} className="text-brand" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900">{cls.name}</p>
                        <p className="text-xs text-zinc-400">{reason}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-brand">
                        {badge}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 4: Suggestions + Period summary ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Improvement suggestions */}
        <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-2">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Sugerencias de mejora</h2>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Alinea más estándares",
                desc:
                  notStartedCount > 0
                    ? `Tienes ${notStartedCount} expectativas sin cubrir. Agrégalas a tus unidades para mejorar el seguimiento.`
                    : "Tus unidades ya cubren todas las expectativas mapeadas. ¡Excelente trabajo!",
                href: "/standards",
                label: "Ver estándares pendientes →",
                active: notStartedCount > 0,
              },
              {
                icon: FileText,
                title: "Completa planificaciones",
                desc:
                  plansCount < lessonCount
                    ? `Tienes ${lessonCount - plansCount} lecciones sin plan de trabajo generado.`
                    : "Todas tus lecciones tienen plan de trabajo. ¡Al día!",
                href: "/lessons",
                label: "Ir a planificaciones →",
                active: plansCount < lessonCount,
              },
              {
                icon: BookOpen,
                title: "Publica cuadernos",
                desc:
                  workbookCount < plansCount
                    ? `Genera cuadernos para las lecciones que ya tienen plan de trabajo.`
                    : "Tus lecciones con plan ya tienen cuadernos generados.",
                href: "/workbooks",
                label: "Ver cuadernos →",
                active: workbookCount < plansCount,
              },
            ].map(({ icon: Icon, title, desc, href, label, active }) => (
              <div
                key={title}
                className={`rounded-xl p-4 ${active ? "bg-teal-50" : "bg-zinc-50"}`}
              >
                <span
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-teal-100 text-brand-teal" : "bg-zinc-200 text-zinc-400"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <p className="mb-1 text-sm font-semibold text-zinc-900">{title}</p>
                <p className="mb-3 text-xs text-zinc-500 leading-relaxed">{desc}</p>
                <Link href={href} className="text-xs font-medium text-brand-teal hover:underline">
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Period summary */}
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="font-semibold text-zinc-900">Resumen del período</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Año escolar 2025–2026</p>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {[
                { label: "Clases activas", value: classCount, icon: Users },
                { label: "Lecciones creadas", value: lessonCount, icon: FileText },
                { label: "Planes generados", value: plansCount, icon: CheckCircle },
                { label: "Cuadernos publicados", value: workbookCount, icon: BookOpen },
                { label: "Expectativas cubiertas", value: coveredCount, icon: BarChart3 },
              ].map(({ label, value, icon: Icon }) => (
                <li key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Icon size={14} className="text-zinc-400" />
                    {label}
                  </div>
                  <span className="font-semibold text-zinc-900">{value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl bg-teal-50 p-4">
              <div className="flex items-center gap-2 text-sm text-brand-teal">
                <TrendingUp size={16} />
                <span className="font-medium">Cobertura DEPR</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-teal">{coveragePercent}%</p>
              <p className="mt-0.5 text-xs text-teal-600">
                {coveredCount} de {totalExpectations} expectativas
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
