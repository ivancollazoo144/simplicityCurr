"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import { generateLessonPlan, type LessonFormat } from "@/lib/generate";

const VALID_FORMATS: LessonFormat[] = ["ICAP", "WARMUP", "5E", "INQUIRY", "UDL"];

export async function createLessonFromExpectationsAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Configura ANTHROPIC_API_KEY en .env.");

  const unitId = String(formData.get("unitId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const rawFormat = String(formData.get("format") ?? "").trim() as LessonFormat;
  const format: LessonFormat = VALID_FORMATS.includes(rawFormat) ? rawFormat : "ICAP";
  const isWeekly = formData.get("isWeekly") === "1";
  const durationRaw = formData.get("durationMinutes");
  const expectationIds = formData.getAll("expectationId") as string[];

  if (!unitId || !title) throw new Error("Título y unidad son requeridos.");
  if (expectationIds.length === 0) throw new Error("Selecciona al menos una expectativa.");

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { subject: true, grade: true },
  });
  if (!unit || unit.teacherId !== teacherId) throw new Error("No autorizado.");

  const order = await prisma.lesson.count({ where: { unitId } });

  const lesson = await prisma.lesson.create({
    data: {
      unitId,
      title,
      format,
      isWeekly,
      durationMinutes: isWeekly ? null : (durationRaw ? Number(durationRaw) : null),
      order,
    },
  });

  if (expectationIds.length > 0) {
    await prisma.lessonExpectation.createMany({
      data: expectationIds.map((expectationId) => ({ lessonId: lesson.id, expectationId })),
    });
    // Also reflect expectations at the unit level so the curriculum map shows coverage
    await prisma.unitExpectation.createMany({
      data: expectationIds.map((expectationId) => ({ unitId: lesson.unitId, expectationId })),
      skipDuplicates: true,
    });
  }

  const expectations = await prisma.lessonExpectation.findMany({
    where: { lessonId: lesson.id },
    include: { expectation: { include: { standard: true } } },
  });

  const language = unit.subject.code === "ING" ? "en" : "es";

  const plan = await generateLessonPlan({
    format,
    isWeekly,
    subject: unit.subject.name,
    grade: unit.grade.label,
    lessonTitle: lesson.title,
    unitTitle: unit.title,
    unitDescription: unit.description,
    durationMinutes: null,
    expectations: expectations.map((le) => ({
      code: le.expectation.code,
      description: le.expectation.description,
      standard: le.expectation.standard.description,
    })),
    language,
  });

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { content: plan as unknown as object },
  });

  redirect(`/lessons/${lesson.id}`);
}
