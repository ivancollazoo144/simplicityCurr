"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

function unitCode(subjectCode: string, gradeLabel: string, n: number) {
  const g = /^\d+$/.test(gradeLabel) ? gradeLabel.padStart(2, "0") : gradeLabel;
  return `${subjectCode}-G${g}-U${String(n).padStart(2, "0")}`;
}

export async function createUnit(formData: FormData) {
  const { teacherId } = await requireSession();
  const subjectId = String(formData.get("subjectId") ?? "");
  const gradeId = String(formData.get("gradeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const classId = String(formData.get("classId") ?? "").trim() || null;
  if (!subjectId || !gradeId || !title) return;

  const [subject, grade, count] = await Promise.all([
    prisma.subject.findUniqueOrThrow({ where: { id: subjectId } }),
    prisma.grade.findUniqueOrThrow({ where: { id: gradeId } }),
    prisma.unit.count({ where: { subjectId, gradeId, teacherId } }),
  ]);

  await prisma.unit.create({
    data: {
      code: unitCode(subject.code, grade.label, count + 1),
      subjectId,
      gradeId,
      teacherId,
      classId,
      title,
      description,
      order: count,
    },
  });
  revalidatePath("/curriculum");
}

export async function deleteUnit(formData: FormData) {
  const { teacherId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit || unit.teacherId !== teacherId) throw new Error("No autorizado");
  await prisma.unit.delete({ where: { id } });
  revalidatePath("/curriculum");
}

export async function toggleUnitExpectation(formData: FormData) {
  const { teacherId } = await requireSession();
  const unitId = String(formData.get("unitId") ?? "");
  const expectationId = String(formData.get("expectationId") ?? "");
  if (!unitId || !expectationId) return;

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit || unit.teacherId !== teacherId) throw new Error("No autorizado");

  const where = { unitId_expectationId: { unitId, expectationId } };
  const existing = await prisma.unitExpectation.findUnique({ where });
  if (existing) {
    await prisma.unitExpectation.delete({ where });
  } else {
    await prisma.unitExpectation.create({ data: { unitId, expectationId } });
  }
  revalidatePath(`/units/${unitId}`);
}
