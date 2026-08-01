import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] ?? "Admin";

if (!email || !password) {
  console.error("Uso: npx tsx scripts/create-admin.ts <email> <clave> [nombre]");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const hash = await bcrypt.hash(password!, 12);
  const teacher = await prisma.teacher.upsert({
    where: { email: email! },
    update: { password: hash, role: "admin", name: name },
    create: { email: email!, password: hash, role: "admin", name: name },
  });
  console.log(`Admin listo: ${teacher.email} (id: ${teacher.id})`);
}

main().finally(() => prisma.$disconnect());
