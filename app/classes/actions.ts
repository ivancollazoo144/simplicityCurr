"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function createClass(formData: FormData) {
  const { teacherId } = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const gradeId = String(formData.get("gradeId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !subjectId || !gradeId) throw new Error("Nombre, materia y grado son requeridos.");

  await prisma.class.create({
    data: { name, description, teacherId, subjectId, gradeId },
  });
  revalidatePath("/classes");
}

export async function deleteClass(formData: FormData) {
  const { teacherId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls || cls.teacherId !== teacherId) throw new Error("No autorizado");
  await prisma.class.delete({ where: { id } });
  revalidatePath("/classes");
}
