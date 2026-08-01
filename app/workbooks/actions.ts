"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateWorkbook } from "@/lib/generate";

export async function generateWorkbookForUnit(formData: FormData) {
  const { teacherId } = await requireSession();
  const unitId = String(formData.get("unitId") ?? "");
  if (!unitId) return;

  const unit = await prisma.unit.findUniqueOrThrow({
    where: { id: unitId, teacherId },
    include: {
      subject: true,
      grade: true,
      expectations: { include: { expectation: { include: { standard: true } } } },
    },
  });

  const content = await generateWorkbook({
    subject: unit.subject.name,
    grade: unit.grade.label,
    unitTitle: unit.title,
    unitDescription: unit.description,
    expectations: unit.expectations.map((ue) => ({
      code: ue.expectation.code,
      description: ue.expectation.description,
      standard: ue.expectation.standard.description,
    })),
  });

  const workbook = await prisma.workbook.create({
    data: {
      title: content.title || `Cuaderno: ${unit.title}`,
      status: "final",
      pages: content as unknown as object,
      unitId: unit.id,
    },
  });

  revalidatePath(`/units/${unitId}`);
  redirect(`/workbooks/${workbook.id}`);
}

export async function deleteWorkbook(formData: FormData) {
  const { teacherId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  if (!id) return;
  const workbook = await prisma.workbook.findUnique({
    where: { id },
    include: { unit: true, lesson: { include: { unit: true } } },
  });
  if (!workbook) throw new Error("No encontrado");
  const ownerTeacherId = workbook.unit?.teacherId ?? workbook.lesson?.unit?.teacherId;
  if (ownerTeacherId !== teacherId) throw new Error("No autorizado");
  await prisma.workbook.delete({ where: { id } });
  if (unitId) revalidatePath(`/units/${unitId}`);
}
