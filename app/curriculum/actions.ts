"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function unitCode(subjectCode: string, gradeLabel: string, n: number) {
  const g = /^\d+$/.test(gradeLabel) ? gradeLabel.padStart(2, "0") : gradeLabel;
  return `${subjectCode}-G${g}-U${String(n).padStart(2, "0")}`;
}

export async function createUnit(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const gradeId = String(formData.get("gradeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!subjectId || !gradeId || !title) return;

  const [subject, count] = await Promise.all([
    prisma.subject.findUniqueOrThrow({ where: { id: subjectId } }),
    prisma.unit.count({ where: { subjectId, gradeId } }),
  ]);
  const grade = await prisma.grade.findUniqueOrThrow({ where: { id: gradeId } });

  await prisma.unit.create({
    data: {
      code: unitCode(subject.code, grade.label, count + 1),
      subjectId,
      gradeId,
      title,
      description,
      order: count,
    },
  });
  revalidatePath("/curriculum");
}

export async function deleteUnit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.unit.delete({ where: { id } });
  revalidatePath("/curriculum");
}

export async function toggleUnitExpectation(formData: FormData) {
  const unitId = String(formData.get("unitId") ?? "");
  const expectationId = String(formData.get("expectationId") ?? "");
  if (!unitId || !expectationId) return;

  const where = { unitId_expectationId: { unitId, expectationId } };
  const existing = await prisma.unitExpectation.findUnique({ where });
  if (existing) {
    await prisma.unitExpectation.delete({ where });
  } else {
    await prisma.unitExpectation.create({ data: { unitId, expectationId } });
  }
  revalidatePath(`/units/${unitId}`);
}
