import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

/**
 * Datos semilla para simplicityCurr.
 *
 * Carga:
 *  - Grados K–12
 *  - Materias base del DEPR
 *  - Set PILOTO de estándares/expectativas de Matemáticas 5.º
 *
 * ⚠️ IMPORTANTE: las expectativas de Mate 5.º de abajo son un set REPRESENTATIVO,
 * estructurado según las áreas de contenido del marco del DEPR, para validar el flujo
 * completo (estándar → currículo → cuaderno). Los códigos y textos exactos deben
 * verificarse/reemplazarse contra el documento oficial "Estándares de Contenido y
 * Expectativas de Grado — Matemáticas" del DEPR (ver scripts/ingest-standards.ts).
 */

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const SUBJECTS = [
  { code: "MAT", name: "Matemáticas" },
  { code: "ESP", name: "Español" },
  { code: "ING", name: "Inglés" },
  { code: "CIE", name: "Ciencias" },
  { code: "EST", name: "Estudios Sociales" },
];

// Estándares de Matemáticas 5.º (piloto). Cada estándar agrupa expectativas.
const MATH_G5 = [
  {
    code: "MA.N.5",
    description: "Numeración y operación",
    expectations: [
      {
        code: "MA.N.5.1",
        description:
          "Lee, escribe, compara y ordena números naturales hasta los millones y decimales hasta las milésimas usando el valor posicional.",
        indicators: [
          "Identifica el valor posicional de cada dígito hasta los millones.",
          "Representa decimales hasta las milésimas en forma estándar y desarrollada.",
        ],
      },
      {
        code: "MA.N.5.2",
        description:
          "Suma y resta fracciones y números mixtos con denominadores diferentes usando fracciones equivalentes.",
        indicators: [
          "Halla fracciones equivalentes para obtener un denominador común.",
          "Resuelve problemas verbales de suma y resta de fracciones.",
        ],
      },
      {
        code: "MA.N.5.3",
        description:
          "Multiplica números naturales de varios dígitos y divide con divisores de dos dígitos de forma fluida.",
        indicators: [
          "Aplica el algoritmo estándar de la multiplicación y división.",
          "Estima productos y cocientes para verificar la razonabilidad.",
        ],
      },
    ],
  },
  {
    code: "MA.A.5",
    description: "Álgebra",
    expectations: [
      {
        code: "MA.A.5.1",
        description:
          "Escribe e interpreta expresiones numéricas sencillas y evalúa siguiendo el orden de las operaciones.",
        indicators: [
          "Usa paréntesis para agrupar operaciones.",
          "Traduce situaciones verbales a expresiones numéricas.",
        ],
      },
      {
        code: "MA.A.5.2",
        description:
          "Genera y analiza patrones numéricos a partir de una regla dada e identifica relaciones entre términos.",
        indicators: ["Continúa y describe patrones de suma y multiplicación."],
      },
    ],
  },
  {
    code: "MA.G.5",
    description: "Geometría",
    expectations: [
      {
        code: "MA.G.5.1",
        description:
          "Clasifica figuras bidimensionales según sus propiedades (lados, ángulos) en una jerarquía.",
        indicators: ["Distingue triángulos y cuadriláteros por sus atributos."],
      },
      {
        code: "MA.G.5.2",
        description:
          "Ubica e interpreta puntos en el primer cuadrante del plano cartesiano usando pares ordenados.",
        indicators: ["Grafica pares ordenados (x, y) y los interpreta en contexto."],
      },
    ],
  },
  {
    code: "MA.M.5",
    description: "Medición",
    expectations: [
      {
        code: "MA.M.5.1",
        description:
          "Convierte entre unidades de medida dentro del mismo sistema (métrico y usual) y resuelve problemas.",
        indicators: ["Convierte unidades de longitud, masa y capacidad."],
      },
      {
        code: "MA.M.5.2",
        description:
          "Calcula el volumen de prismas rectangulares contando cubos unitarios y aplicando la fórmula V = l × a × h.",
        indicators: ["Relaciona el conteo de cubos unitarios con la fórmula del volumen."],
      },
    ],
  },
  {
    code: "MA.E.5",
    description: "Análisis de datos y probabilidad",
    expectations: [
      {
        code: "MA.E.5.1",
        description:
          "Organiza datos en tablas y gráficas (barras, líneas, puntos) y los interpreta para responder preguntas.",
        indicators: ["Construye e interpreta gráficas de barras y de línea."],
      },
      {
        code: "MA.E.5.2",
        description:
          "Calcula e interpreta la media de un conjunto de datos y describe su tendencia.",
        indicators: ["Halla el promedio (media) de un conjunto de datos."],
      },
    ],
  },
];

async function main() {
  // Grados
  for (let i = 0; i < GRADES.length; i++) {
    const label = GRADES[i];
    await prisma.grade.upsert({
      where: { label },
      update: { order: i },
      create: { label, order: i },
    });
  }

  // Materias
  for (const s of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: s,
    });
  }

  // Estándares y expectativas piloto: Matemáticas 5.º
  const mat = await prisma.subject.findUniqueOrThrow({ where: { code: "MAT" } });
  const g5 = await prisma.grade.findUniqueOrThrow({ where: { label: "5" } });

  for (const std of MATH_G5) {
    const standard = await prisma.standard.upsert({
      where: { subjectId_gradeId_code: { subjectId: mat.id, gradeId: g5.id, code: std.code } },
      update: { description: std.description },
      create: {
        subjectId: mat.id,
        gradeId: g5.id,
        code: std.code,
        description: std.description,
      },
    });

    for (const exp of std.expectations) {
      await prisma.expectation.upsert({
        where: { standardId_code: { standardId: standard.id, code: exp.code } },
        update: { description: exp.description, indicators: exp.indicators },
        create: {
          standardId: standard.id,
          code: exp.code,
          description: exp.description,
          indicators: exp.indicators,
        },
      });
    }
  }

  const counts = {
    grados: await prisma.grade.count(),
    materias: await prisma.subject.count(),
    estandares: await prisma.standard.count(),
    expectativas: await prisma.expectation.count(),
  };
  console.log("Seed completado:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
