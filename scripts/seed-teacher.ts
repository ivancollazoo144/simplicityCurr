import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };

  const name = get("--name") ?? "Ivan Collazo";
  const email = get("--email") ?? "admin@simplicity.edu";
  const password = get("--password") ?? "simplicity2026";
  const role = get("--role") ?? "admin";

  const hashed = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: { name, password: hashed, role },
    create: { name, email, password: hashed, role },
  });
  console.log(`✓ Teacher upserted: ${teacher.name} (${teacher.email}) — role: ${teacher.role}`);
  console.log(`  ID: ${teacher.id}`);

  // Assign orphan units (no teacherId) to this teacher
  const updated = await prisma.unit.updateMany({
    where: { teacherId: teacher.id ? undefined : teacher.id },
    data: { teacherId: teacher.id },
  });
  if (updated.count > 0) console.log(`  → ${updated.count} unidad(es) sin dueño asignadas a este maestro.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
