"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const VALID_ROLES = ["teacher", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

function parsePassword(raw: FormDataEntryValue | null): string {
  const pw = String(raw ?? "").trim();
  if (!pw || pw.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  if (pw.length > 72) throw new Error("Contraseña demasiado larga.");
  return pw;
}

export async function createTeacher(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = parsePassword(formData.get("password"));
  const roleRaw = String(formData.get("role") ?? "teacher");

  if (!name) throw new Error("Nombre requerido.");
  if (!email || !email.includes("@")) throw new Error("Email inválido.");
  if (!(VALID_ROLES as readonly string[]).includes(roleRaw)) throw new Error("Rol inválido.");
  const role = roleRaw as Role;

  const hashed = await bcrypt.hash(password, 10);
  await prisma.teacher.create({ data: { name, email, password: hashed, role } });
  revalidatePath("/admin/teachers");
}

export async function deleteTeacher(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const [admins, target] = await Promise.all([
      tx.teacher.count({ where: { role: "admin" } }),
      tx.teacher.findUnique({ where: { id } }),
    ]);
    if (target?.role === "admin" && admins <= 1) {
      throw new Error("No puedes eliminar el único administrador.");
    }
    await tx.teacher.delete({ where: { id } });
  });

  revalidatePath("/admin/teachers");
}

export async function updateTeacherRole(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const roleRaw = String(formData.get("role") ?? "");

  if (!(VALID_ROLES as readonly string[]).includes(roleRaw)) throw new Error("Rol inválido.");
  const role = roleRaw as Role;

  await prisma.teacher.update({ where: { id }, data: { role } });
  revalidatePath("/admin/teachers");
}

export async function resetTeacherPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const password = parsePassword(formData.get("password"));

  const hashed = await bcrypt.hash(password, 10);
  await prisma.teacher.update({ where: { id }, data: { password: hashed } });
  revalidatePath("/admin/teachers");
}
