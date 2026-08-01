"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import {
  FORMAT_SECTIONS,
  generateLessonPlan,
  generateLessonWorkbook,
  generateWeekWorkbook,
  type LessonFormat,
  type LessonPlanContent,
} from "@/lib/generate";

export async function createLesson(formData: FormData) {
  const { teacherId } = await requireSession();
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!unitId || !title) return;

  const format = (formData.get("format") as LessonFormat | null) || null;
  const durationRaw = formData.get("durationMinutes");
  const weekRaw = formData.get("weekNumber");
  const expectationIds = formData.getAll("expectationId").map(String).filter(Boolean);

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit || unit.teacherId !== teacherId) throw new Error("No autorizado");
  const order = await prisma.lesson.count({ where: { unitId } });

  const lesson = await prisma.lesson.create({
    data: {
      unitId,
      title,
      format: format || null,
      durationMinutes: durationRaw ? Number(durationRaw) : null,
      weekNumber: weekRaw ? Number(weekRaw) : null,
      order,
    },
  });

  for (const expectationId of expectationIds) {
    await prisma.lessonExpectation.create({ data: { lessonId: lesson.id, expectationId } });
  }

  revalidatePath(`/units/${unitId}`);
}

export async function deleteLesson(formData: FormData) {
  const { teacherId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  if (!id) return;
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { unit: true } });
  if (!lesson || lesson.unit.teacherId !== teacherId) throw new Error("No autorizado");
  await prisma.lesson.delete({ where: { id } });
  if (unitId) revalidatePath(`/units/${unitId}`);
}

export async function toggleLessonExpectation(formData: FormData) {
  const { teacherId } = await requireSession();
  const lessonId = String(formData.get("lessonId") ?? "");
  const expectationId = String(formData.get("expectationId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  if (!lessonId || !expectationId) return;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { unit: true } });
  if (!lesson || lesson.unit.teacherId !== teacherId) throw new Error("No autorizado");

  const existing = await prisma.lessonExpectation.findUnique({
    where: { lessonId_expectationId: { lessonId, expectationId } },
  });
  if (existing) {
    await prisma.lessonExpectation.delete({ where: { lessonId_expectationId: { lessonId, expectationId } } });
  } else {
    await prisma.lessonExpectation.create({ data: { lessonId, expectationId } });
  }

  revalidatePath(`/lessons/${lessonId}`);
  if (unitId) revalidatePath(`/units/${unitId}`);
}

export async function generateLessonPlanAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Configura ANTHROPIC_API_KEY en .env para generar planes.");
  }

  const lessonId = String(formData.get("lessonId") ?? "");
  if (!lessonId) return;

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: {
      unit: { include: { subject: true, grade: true } },
      expectations: { include: { expectation: { include: { standard: true } } } },
    },
  });
  if (lesson.unit.teacherId !== teacherId) throw new Error("No autorizado");

  const language = lesson.unit.subject.code === "ING" ? "en" : "es";
  const format: LessonFormat = (lesson.format as LessonFormat) || "ICAP";

  const plan = await generateLessonPlan({
    format,
    subject: lesson.unit.subject.name,
    grade: lesson.unit.grade.label,
    lessonTitle: lesson.title,
    unitTitle: lesson.unit.title,
    unitDescription: lesson.unit.description,
    durationMinutes: lesson.durationMinutes,
    expectations: lesson.expectations.map((le) => ({
      code: le.expectation.code,
      description: le.expectation.description,
      standard: le.expectation.standard.description,
    })),
    language,
  });

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { content: plan as unknown as object },
  });

  revalidatePath(`/lessons/${lessonId}`);
  redirect(`/lessons/${lessonId}`);
}

export async function generateLessonWorkbookAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Configura ANTHROPIC_API_KEY en .env para generar cuadernos.");
  }

  const lessonId = String(formData.get("lessonId") ?? "");
  if (!lessonId) return;

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { unit: { include: { subject: true, grade: true } } },
  });
  if (lesson.unit.teacherId !== teacherId) throw new Error("No autorizado");

  if (!lesson.content) {
    throw new Error("Genera el plan de trabajo primero antes de crear el cuaderno.");
  }

  const language = lesson.unit.subject.code === "ING" ? "en" : "es";
  const lessonPlan = lesson.content as unknown as LessonPlanContent;

  const content = await generateLessonWorkbook({
    subject: lesson.unit.subject.name,
    grade: lesson.unit.grade.label,
    lessonTitle: lesson.title,
    unitTitle: lesson.unit.title,
    lessonPlan,
    language,
  });

  const workbook = await prisma.workbook.create({
    data: {
      title: content.title || `Cuaderno: ${lesson.title}`,
      status: "final",
      pages: content as unknown as object,
      lessonId: lesson.id,
      unitId: lesson.unitId,
    },
  });

  revalidatePath(`/lessons/${lessonId}`);
  redirect(`/workbooks/${workbook.id}`);
}

export async function generateWeekWorkbookAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Configura ANTHROPIC_API_KEY en .env para generar cuadernos.");
  }

  const unitId = String(formData.get("unitId") ?? "");
  const weekNumberRaw = formData.get("weekNumber");
  const weekNumber = weekNumberRaw ? Number(weekNumberRaw) : null;
  if (!unitId) return;

  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: unitId, teacherId },
    include: {
      subject: true,
      grade: true,
      expectations: { include: { expectation: { include: { standard: true } } } },
      lessons: {
        where: weekNumber !== null ? { weekNumber } : {},
        orderBy: { order: "asc" },
      },
    },
  });

  const lessonsWithPlans = unit.lessons.filter((l) => l.content !== null);
  if (lessonsWithPlans.length === 0) {
    throw new Error("Genera los planes de trabajo de las lecciones primero.");
  }

  const language = unit.subject.code === "ING" ? "en" : "es";

  const content = await generateWeekWorkbook({
    subject: unit.subject.name,
    grade: unit.grade.label,
    unitTitle: unit.title,
    weekNumber,
    lessons: lessonsWithPlans.map((l) => {
      const plan = l.content as unknown as LessonPlanContent;
      const fmt: LessonFormat = (l.format as LessonFormat) || "ICAP";
      return {
        title: l.title,
        objectives: plan.objectives ?? [],
        format: fmt,
        sectionNames: FORMAT_SECTIONS[fmt],
      };
    }),
    expectations: unit.expectations.map((ue) => ({
      code: ue.expectation.code,
      description: ue.expectation.description,
      standard: ue.expectation.standard.description,
    })),
    language,
  });

  const weekLabel = weekNumber ? `Semana ${weekNumber}` : "Semanal";
  const workbook = await prisma.workbook.create({
    data: {
      title: content.title || `Cuaderno ${weekLabel}: ${unit.title}`,
      status: "final",
      pages: content as unknown as object,
      unitId: unit.id,
    },
  });

  revalidatePath(`/units/${unitId}`);
  redirect(`/workbooks/${workbook.id}`);
}
