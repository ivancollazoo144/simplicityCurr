"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Dummy hash used to normalize response time when no user is found,
// preventing timing-based email enumeration attacks.
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// In-process rate limiter: keyed by client IP.
// 10 failed attempts within 15 minutes → block until the window resets.
const loginAttempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function loginAction(formData: FormData) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (isRateLimited(ip)) redirect("/login?error=rate");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!password || password.length > 72) redirect("/login?error=1");

  const teacher = await prisma.teacher.findUnique({ where: { email } });

  // Always run bcrypt regardless of whether user exists — prevents timing oracle
  const hashToCheck = teacher?.password ?? DUMMY_HASH;
  const valid = await bcrypt.compare(password, hashToCheck);

  if (!teacher || !valid) redirect("/login?error=1");

  clearAttempts(ip);

  const session = await getSession();
  session.teacherId = teacher.id;
  session.teacherName = teacher.name;
  session.role = teacher.role as "teacher" | "admin";
  await session.save();

  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  await session.destroy();
  redirect("/login");
}
