import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

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

// Clave corta por apellido → keyword para buscar en DB
const TEACHER_KEY: Record<string, string> = {
  brenda:     "Brenda",
  victor:     "Victor",
  yanuska:    "Yanuska",
  angelica:   "Angelica",
  walenda:    "Walenda",
  filiberto:  "Filiberto",
  vanessa:    "Vanessa",
  emilienys:  "Emilienys",
  michele:    "Michele",
  raul:       "Raul",
  lillibette: "Lillibette",
};

// [subjectCode, grade, teacherKey, period]
const CLASSES: [string, string, string, string][] = [
  ["ALG1", "Octavo",    "brenda",     "Cuarta Clase IS"],
  ["ALG2", "Noveno",    "victor",     "Quinta Clase IS"],
  ["BIO",  "Decimo",    "victor",     "Cuarta Clase IS"],
  ["CIE",  "Cuarto",    "yanuska",    "Quinta Clase"],
  ["CIE",  "Kinder",    "angelica",   "Cuarta Clase"],
  ["CIE",  "Primero",   "angelica",   "Cuarta Clase"],
  ["CIE",  "Quinto",    "yanuska",    "Primera clase"],
  ["CIE",  "Segundo",   "walenda",    "Quinta Clase"],
  ["CIE",  "Sexto",     "yanuska",    "Cuarta Clase"],
  ["CIE",  "Tercero",   "walenda",    "Quinta Clase"],
  ["CF",   "Octavo",    "yanuska",    "Segunda Clase IS"],
  ["CQ",   "Septimo",   "yanuska",    "Segunda Clase IS"],
  ["CS",   "Duodecimo", "filiberto",  "Cuarta Clase IS"],
  ["CTE",  "Noveno",    "yanuska",    "Primera clase"],
  ["EF",   "Cuarto",    "raul",       "Tercera Clase"],
  ["EF",   "Kinder",    "vanessa",    "Quinta Clase"],
  ["EF",   "Primero",   "vanessa",    "Sexta Clase"],
  ["EF",   "Quinto",    "vanessa",    "Segunda Clase"],
  ["EF",   "Segundo",   "vanessa",    "Cuarta Clase"],
  ["EF",   "Sexto",     "vanessa",    "Primera clase"],
  ["EF",   "Tercero",   "vanessa",    "Cuarta Clase"],
  ["ESC",  "Cuarto",    "walenda",    "Cuarta Clase"],
  ["ESC",  "Quinto",    "angelica",   "Quinta Clase"],
  ["ESP",  "Cuarto",    "vanessa",    "Primera clase"],
  ["ESP",  "Decimo",    "emilienys",  "Segunda Clase IS"],
  ["ESP",  "Duodecimo", "emilienys",  "Primera clase"],
  ["ESP",  "Kinder",    "angelica",   "Primera clase"],
  ["ESP",  "Noveno",    "emilienys",  "Tercera Clase IS"],
  ["ESP",  "Octavo",    "emilienys",  "Quinta Clase IS"],
  ["ESP",  "Primero",   "angelica",   "Primera clase"],
  ["ESP",  "Quinto",    "vanessa",    "Cuarta Clase"],
  ["ESP",  "Segundo",   "walenda",    "Primera clase"],
  ["ESP",  "Septimo",   "emilienys",  "Quinta Clase IS"],
  ["ESP",  "Sexto",     "vanessa",    "Quinta Clase"],
  ["ESP",  "Tercero",   "walenda",    "Primera clase"],
  ["ESP",  "Undecimo",  "emilienys",  "Primera clase"],
  ["EST",  "Cuarto",    "michele",    "Primera clase"],
  ["EST",  "Kinder",    "angelica",   "Tercera Clase"],
  ["EST",  "Primero",   "angelica",   "Tercera Clase"],
  ["EST",  "Quinto",    "michele",    "Tercera Clase"],
  ["EST",  "Segundo",   "walenda",    "Tercera Clase"],
  ["EST",  "Sexto",     "michele",    "Segunda Clase"],
  ["EST",  "Tercero",   "walenda",    "Tercera Clase"],
  ["FIS",  "Duodecimo", "brenda",     "Quinta Clase IS"],
  ["GEO",  "Decimo",    "victor",     "Tercera Clase IS"],
  ["HCP",  "Decimo",    "filiberto",  "Primera clase"],
  ["HMM",  "Noveno",    "filiberto",  "Segunda Clase IS"],
  ["HIS",  "Septimo",   "filiberto",  "Tercera Clase IS"],
  ["HEU",  "Undecimo",  "filiberto",  "Cuarta Clase IS"],
  ["ING",  "Cuarto",    "raul",       "Tercera Clase"],
  ["ING",  "Decimo",    "lillibette", "Quinta Clase IS"],
  ["ING",  "Duodecimo", "lillibette", "Tercera Clase IS"],
  ["ING",  "Kinder",    "raul",       "Quinta Clase"],
  ["ING",  "Noveno",    "lillibette", "Cuarta Clase IS"],
  ["ING",  "Octavo",    "lillibette", "Primera clase"],
  ["ING",  "Primero",   "raul",       "Quinta Clase"],
  ["ING",  "Quinto",    "raul",       "Segunda Clase"],
  ["ING",  "Segundo",   "raul",       "Cuarta Clase"],
  ["ING",  "Septimo",   "lillibette", "Primera clase"],
  ["ING",  "Sexto",     "raul",       "Primera clase"],
  ["ING",  "Tercero",   "raul",       "Cuarta Clase"],
  ["ING",  "Undecimo",  "lillibette", "Tercera Clase IS"],
  ["MAT",  "Cuarto",    "brenda",     "Segunda Clase"],
  ["MAT",  "Kinder",    "angelica",   "Segunda Clase"],
  ["MAT",  "Primero",   "angelica",   "Segunda Clase"],
  ["MAT",  "Quinto",    "brenda",     "Primera clase"],
  ["MAT",  "Segundo",   "walenda",    "Segunda Clase"],
  ["MAT",  "Sexto",     "brenda",     "Tercera Clase"],
  ["MAT",  "Tercero",   "walenda",    "Segunda Clase"],
  ["PALG", "Septimo",   "brenda",     "Cuarta Clase IS"],
  ["PCAL", "Duodecimo", "victor",     "Segunda Clase IS"],
  ["QUI",  "Undecimo",  "victor",     "Quinta Clase IS"],
  ["SAL",  "Noveno",    "yanuska",    "Primera clase"],
  ["SOC",  "Octavo",    "filiberto",  "Tercera Clase IS"],
  ["TRI",  "Undecimo",  "victor",     "Segunda Clase IS"],
  ["VIR",  "Segundo",   "walenda",    "Primera clase"],
  ["VIRE", "Segundo",   "raul",       "Primera clase"],
];

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

  // 2. Cargar maestros de la DB y hacer mapa por primer nombre (case-insensitive)
  const allTeachers = await prisma.teacher.findMany({ select: { id: true, name: true, email: true } });
  console.log(`\nMaestros encontrados en DB (${allTeachers.length}):`);
  allTeachers.forEach(t => console.log(`  ${t.name} — ${t.email}`));

  // Mapa: keyword (primer nombre) → teacher
  const teacherMap = new Map<string, typeof allTeachers[0]>();
  for (const [key, keyword] of Object.entries(TEACHER_KEY)) {
    const match = allTeachers.find(t =>
      t.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) {
      teacherMap.set(key, match);
    } else {
      console.warn(`  ⚠ No encontrado en DB: "${keyword}" (key: ${key})`);
    }
  }

  // 3. Crear clases
  let created = 0;
  let skipped = 0;

  for (const [subjectCode, gradeSpanish, teacherKey, period] of CLASSES) {
    const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
    const gradeLabel = GRADE_MAP[gradeSpanish];
    const grade = await prisma.grade.findUnique({ where: { label: gradeLabel } });
    const teacher = teacherMap.get(teacherKey);

    if (!subject || !grade || !teacher) {
      console.warn(`  ⚠ Saltando: ${subjectCode}/${gradeSpanish} (teacher=${teacherKey})`);
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
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
