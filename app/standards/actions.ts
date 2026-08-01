"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createLessonFromExpectationsAction(formData: FormData) {
  const { teacherId } = await requireSession();

  const unitId = String(formData.get("unitId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const expectationIds = formData.getAll("expectationId") as string[];

  if (!unitId || !title) throw new Error("Título y unidad son requeridos.");
  if (expectationIds.length === 0) throw new Error("Selecciona al menos una expectativa.");

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit || unit.teacherId !== teacherId) throw new Error("No autorizado.");

  const order = await prisma.lesson.count({ where: { unitId } });

  const lesson = await prisma.lesson.create({
    data: { unitId, title, order },
  });

  for (const expectationId of expectationIds) {
    await prisma.lessonExpectation.create({
      data: { lessonId: lesson.id, expectationId },
    });
  }

  redirect(`/lessons/${lesson.id}`);
}
