"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function adminCreateClass(formData: FormData) {
  await requireAdmin();

  const name      = String(formData.get("name")      ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const gradeId   = String(formData.get("gradeId")   ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !subjectId || !gradeId || !teacherId)
    throw new Error("Nombre, materia, grado y maestro son requeridos.");

  await prisma.class.create({
    data: { name, subjectId, gradeId, teacherId, description: description || null },
  });

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function adminDeleteClass(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.class.delete({ where: { id } });
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function adminReassignClass(formData: FormData) {
  await requireAdmin();
  const id        = String(formData.get("id")        ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!id || !teacherId) return;
  await prisma.class.update({ where: { id }, data: { teacherId } });
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}
