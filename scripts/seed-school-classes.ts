import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Grado en español → label en DB
const GRADE_MAP: Record<string, string> = {
  Kinder:    "K",
  Primero:   "1",
  Segundo:   "2",
  Tercero:   "3",
  Cuarto:    "4",
  Quinto:    "5",
  Sexto:     "6",
  Septimo:   "7",
  Octavo:    "8",
  Noveno:    "9",
  Decimo:    "10",
  Undecimo:  "11",
  Duodecimo: "12",
};

// Grado en español → nombre para el título de la clase
const GRADE_TITLE: Record<string, string> = {
  Kinder:    "Kinder",
  Primero:   "Primero",
  Segundo:   "Segundo",
  Tercero:   "Tercero",
  Cuarto:    "Cuarto",
  Quinto:    "Quinto",
  Sexto:     "Sexto",
  Septimo:   "Séptimo",
  Octavo:    "Octavo",
  Noveno:    "Noveno",
  Decimo:    "Décimo",
  Undecimo:  "Undécimo",
  Duodecimo: "Duodécimo",
};

const SUBJECTS = [
  { code: "ALG1", name: "Algebra 1" },
  { code: "ALG2", name: "Algebra 2" },
  { code: "BIO",  name: "Biología" },
  { code: "CIE",  name: "Ciencias" },
  { code: "CF",   name: "Ciencias Física" },
  { code: "CQ",   name: "Ciencias Químicas" },
  { code: "CS",   name: "Ciencias Sociales" },
  { code: "CTE",  name: "Ciencias Terrestre y del Espacio" },
  { code: "EF",   name: "Educación Física" },
  { code: "ESC",  name: "Escritura" },
  { code: "ESP",  name: "Español" },
  { code: "EST",  name: "Estudios Sociales" },
  { code: "FIS",  name: "Física" },
  { code: "GEO",  name: "Geometría" },
  { code: "HCP",  name: "Hist. Cont. de PR" },
  { code: "HMM",  name: "Hist. del Mundo Moderna y Cont." },
  { code: "HIS",  name: "Historia" },
  { code: "HEU",  name: "Historia E.U." },
  { code: "ING",  name: "Inglés" },
  { code: "MAT",  name: "Matemáticas" },
  { code: "PALG", name: "Pre-Algebra" },
  { code: "PCAL", name: "Pre-Cálculo" },
  { code: "QUI",  name: "Química" },
  { code: "SAL",  name: "Salud" },
  { code: "SOC",  name: "Sociales de América" },
  { code: "TRI",  name: "Trigonometría" },
  { code: "VIR",  name: "Virtual 2-3" },
  { code: "VIRE", name: "Virtual 2-3 Inglés" },
];

const TEACHERS = [
  { name: "Brenda Gonzalez",          email: "brenda.gonzalez@simplicity.edu" },
  { name: "Victor Ortiz",             email: "victor.ortiz@simplicity.edu" },
  { name: "Yanuska M Diaz Medina",    email: "yanuska.diaz@simplicity.edu" },
  { name: "Angelica M Lopez Franco",  email: "angelica.lopez@simplicity.edu" },
  { name: "Walenda Nieves",           email: "walenda.nieves@simplicity.edu" },
  { name: "Filiberto Marmolejos",     email: "filiberto.marmolejos@simplicity.edu" },
  { name: "Vanessa C Nieves Landron", email: "vanessa.nieves@simplicity.edu" },
  { name: "Emilienys Melendez Vega",  email: "emilienys.melendez@simplicity.edu" },
  { name: "Michele Rodriguez",        email: "michele.rodriguez@simplicity.edu" },
  { name: "Raul Perez",               email: "raul.perez@simplicity.edu" },
  { name: "Lillibette Negron",        email: "lillibette.negron@simplicity.edu" },
];

// [subjectCode, grade, teacherEmail, period]
const CLASSES: [string, string, string, string][] = [
  ["ALG1", "Octavo",    "brenda.gonzalez@simplicity.edu",       "Cuarta Clase IS"],
  ["ALG2", "Noveno",    "victor.ortiz@simplicity.edu",          "Quinta Clase IS"],
  ["BIO",  "Decimo",    "victor.ortiz@simplicity.edu",          "Cuarta Clase IS"],
  ["CIE",  "Cuarto",    "yanuska.diaz@simplicity.edu",          "Quinta Clase"],
  ["CIE",  "Kinder",    "angelica.lopez@simplicity.edu",        "Cuarta Clase"],
  ["CIE",  "Primero",   "angelica.lopez@simplicity.edu",        "Cuarta Clase"],
  ["CIE",  "Quinto",    "yanuska.diaz@simplicity.edu",          "Primera clase"],
  ["CIE",  "Segundo",   "walenda.nieves@simplicity.edu",        "Quinta Clase"],
  ["CIE",  "Sexto",     "yanuska.diaz@simplicity.edu",          "Cuarta Clase"],
  ["CIE",  "Tercero",   "walenda.nieves@simplicity.edu",        "Quinta Clase"],
  ["CF",   "Octavo",    "yanuska.diaz@simplicity.edu",          "Segunda Clase IS"],
  ["CQ",   "Septimo",   "yanuska.diaz@simplicity.edu",          "Segunda Clase IS"],
  ["CS",   "Duodecimo", "filiberto.marmolejos@simplicity.edu",  "Cuarta Clase IS"],
  ["CTE",  "Noveno",    "yanuska.diaz@simplicity.edu",          "Primera clase"],
  ["EF",   "Cuarto",    "raul.perez@simplicity.edu",            "Tercera Clase"],
  ["EF",   "Kinder",    "vanessa.nieves@simplicity.edu",        "Quinta Clase"],
  ["EF",   "Primero",   "vanessa.nieves@simplicity.edu",        "Sexta Clase"],
  ["EF",   "Quinto",    "vanessa.nieves@simplicity.edu",        "Segunda Clase"],
  ["EF",   "Segundo",   "vanessa.nieves@simplicity.edu",        "Cuarta Clase"],
  ["EF",   "Sexto",     "vanessa.nieves@simplicity.edu",        "Primera clase"],
  ["EF",   "Tercero",   "vanessa.nieves@simplicity.edu",        "Cuarta Clase"],
  ["ESC",  "Cuarto",    "walenda.nieves@simplicity.edu",        "Cuarta Clase"],
  ["ESC",  "Quinto",    "angelica.lopez@simplicity.edu",        "Quinta Clase"],
  ["ESP",  "Cuarto",    "vanessa.nieves@simplicity.edu",        "Primera clase"],
  ["ESP",  "Decimo",    "emilienys.melendez@simplicity.edu",    "Segunda Clase IS"],
  ["ESP",  "Duodecimo", "emilienys.melendez@simplicity.edu",    "Primera clase"],
  ["ESP",  "Kinder",    "angelica.lopez@simplicity.edu",        "Primera clase"],
  ["ESP",  "Noveno",    "emilienys.melendez@simplicity.edu",    "Tercera Clase IS"],
  ["ESP",  "Octavo",    "emilienys.melendez@simplicity.edu",    "Quinta Clase IS"],
  ["ESP",  "Primero",   "angelica.lopez@simplicity.edu",        "Primera clase"],
  ["ESP",  "Quinto",    "vanessa.nieves@simplicity.edu",        "Cuarta Clase"],
  ["ESP",  "Segundo",   "walenda.nieves@simplicity.edu",        "Primera clase"],
  ["ESP",  "Septimo",   "emilienys.melendez@simplicity.edu",    "Quinta Clase IS"],
  ["ESP",  "Sexto",     "vanessa.nieves@simplicity.edu",        "Quinta Clase"],
  ["ESP",  "Tercero",   "walenda.nieves@simplicity.edu",        "Primera clase"],
  ["ESP",  "Undecimo",  "emilienys.melendez@simplicity.edu",    "Primera clase"],
  ["EST",  "Cuarto",    "michele.rodriguez@simplicity.edu",     "Primera clase"],
  ["EST",  "Kinder",    "angelica.lopez@simplicity.edu",        "Tercera Clase"],
  ["EST",  "Primero",   "angelica.lopez@simplicity.edu",        "Tercera Clase"],
  ["EST",  "Quinto",    "michele.rodriguez@simplicity.edu",     "Tercera Clase"],
  ["EST",  "Segundo",   "walenda.nieves@simplicity.edu",        "Tercera Clase"],
  ["EST",  "Sexto",     "michele.rodriguez@simplicity.edu",     "Segunda Clase"],
  ["EST",  "Tercero",   "walenda.nieves@simplicity.edu",        "Tercera Clase"],
  ["FIS",  "Duodecimo", "brenda.gonzalez@simplicity.edu",       "Quinta Clase IS"],
  ["GEO",  "Decimo",    "victor.ortiz@simplicity.edu",          "Tercera Clase IS"],
  ["HCP",  "Decimo",    "filiberto.marmolejos@simplicity.edu",  "Primera clase"],
  ["HMM",  "Noveno",    "filiberto.marmolejos@simplicity.edu",  "Segunda Clase IS"],
  ["HIS",  "Septimo",   "filiberto.marmolejos@simplicity.edu",  "Tercera Clase IS"],
  ["HEU",  "Undecimo",  "filiberto.marmolejos@simplicity.edu",  "Cuarta Clase IS"],
  ["ING",  "Cuarto",    "raul.perez@simplicity.edu",            "Tercera Clase"],
  ["ING",  "Decimo",    "lillibette.negron@simplicity.edu",     "Quinta Clase IS"],
  ["ING",  "Duodecimo", "lillibette.negron@simplicity.edu",     "Tercera Clase IS"],
  ["ING",  "Kinder",    "raul.perez@simplicity.edu",            "Quinta Clase"],
  ["ING",  "Noveno",    "lillibette.negron@simplicity.edu",     "Cuarta Clase IS"],
  ["ING",  "Octavo",    "lillibette.negron@simplicity.edu",     "Primera clase"],
  ["ING",  "Primero",   "raul.perez@simplicity.edu",            "Quinta Clase"],
  ["ING",  "Quinto",    "raul.perez@simplicity.edu",            "Segunda Clase"],
  ["ING",  "Segundo",   "raul.perez@simplicity.edu",            "Cuarta Clase"],
  ["ING",  "Septimo",   "lillibette.negron@simplicity.edu",     "Primera clase"],
  ["ING",  "Sexto",     "raul.perez@simplicity.edu",            "Primera clase"],
  ["ING",  "Tercero",   "raul.perez@simplicity.edu",            "Cuarta Clase"],
  ["ING",  "Undecimo",  "lillibette.negron@simplicity.edu",     "Tercera Clase IS"],
  ["MAT",  "Cuarto",    "brenda.gonzalez@simplicity.edu",       "Segunda Clase"],
  ["MAT",  "Kinder",    "angelica.lopez@simplicity.edu",        "Segunda Clase"],
  ["MAT",  "Primero",   "angelica.lopez@simplicity.edu",        "Segunda Clase"],
  ["MAT",  "Quinto",    "brenda.gonzalez@simplicity.edu",       "Primera clase"],
  ["MAT",  "Segundo",   "walenda.nieves@simplicity.edu",        "Segunda Clase"],
  ["MAT",  "Sexto",     "brenda.gonzalez@simplicity.edu",       "Tercera Clase"],
  ["MAT",  "Tercero",   "walenda.nieves@simplicity.edu",        "Segunda Clase"],
  ["PALG", "Septimo",   "brenda.gonzalez@simplicity.edu",       "Cuarta Clase IS"],
  ["PCAL", "Duodecimo", "victor.ortiz@simplicity.edu",          "Segunda Clase IS"],
  ["QUI",  "Undecimo",  "victor.ortiz@simplicity.edu",          "Quinta Clase IS"],
  ["SAL",  "Noveno",    "yanuska.diaz@simplicity.edu",          "Primera clase"],
  ["SOC",  "Octavo",    "filiberto.marmolejos@simplicity.edu",  "Tercera Clase IS"],
  ["TRI",  "Undecimo",  "victor.ortiz@simplicity.edu",          "Segunda Clase IS"],
  ["VIR",  "Segundo",   "walenda.nieves@simplicity.edu",        "Primera clase"],
  ["VIRE", "Segundo",   "raul.perez@simplicity.edu",            "Primera clase"],
];

const DEFAULT_PASSWORD = "Simplicity2025!";

async function main() {
  // 1. Upsert materias
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s,
    });
  }
  console.log(`✓ ${SUBJECTS.length} materias verificadas`);

  // 2. Crear / actualizar maestros
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const t of TEACHERS) {
    await prisma.teacher.upsert({
      where: { email: t.email },
      update: { name: t.name },
      create: { name: t.name, email: t.email, password: hashed, role: "teacher" },
    });
  }
  console.log(`✓ ${TEACHERS.length} maestros creados`);

  // 3. Crear clases
  let created = 0;
  let skipped = 0;

  for (const [subjectCode, gradeSpanish, teacherEmail, period] of CLASSES) {
    const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
    const gradeLabel = GRADE_MAP[gradeSpanish];
    const grade = await prisma.grade.findUnique({ where: { label: gradeLabel } });
    const teacher = await prisma.teacher.findUnique({ where: { email: teacherEmail } });

    if (!subject || !grade || !teacher) {
      console.warn(`  ⚠ No encontrado: ${subjectCode} / ${gradeSpanish} / ${teacherEmail}`);
      skipped++;
      continue;
    }

    const existing = await prisma.class.findFirst({
      where: { teacherId: teacher.id, subjectId: subject.id, gradeId: grade.id },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const className = `${GRADE_TITLE[gradeSpanish]} ${subject.name}`;
    await prisma.class.create({
      data: {
        name: className,
        description: period,
        teacherId: teacher.id,
        subjectId: subject.id,
        gradeId: grade.id,
      },
    });
    console.log(`  + ${className} → ${teacher.name}`);
    created++;
  }

  console.log(`\n✓ ${created} clases creadas, ${skipped} omitidas`);
  console.log(`\nContraseña para todos los maestros nuevos: ${DEFAULT_PASSWORD}`);
  console.log("Emails generados como: nombre.apellido@simplicity.edu");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
