import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_OPTIONS } from "./session-config";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET es requerido en .env — genera uno con: openssl rand -hex 32");
}

export type SessionData = {
  teacherId: string;
  teacherName: string;
  role: "teacher" | "admin";
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.teacherId) throw new Error("No autorizado");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("Solo administradores");
  return session;
}
