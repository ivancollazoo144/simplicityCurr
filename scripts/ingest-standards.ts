import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

/**
 * Ingesta de estándares del DEPR (andamiaje — Fase 1 / escalado Fase 5).
 *
 * Flujo:
 *   1. Lee un PDF oficial del DEPR desde data/raw/ (descárgalo manualmente o con curl;
 *      el host del DEPR puede bloquear descargas automáticas en algunos entornos).
 *   2. Extrae el texto con pdf-parse.
 *   3. Usa Claude (claude-sonnet-4-6) para estructurar el texto en estándares y
 *      expectativas para un grado dado.
 *   4. Inserta/actualiza en SQLite vía Prisma.
 *
 * Requisitos: ANTHROPIC_API_KEY en .env.
 *
 * Uso:
 *   npx tsx scripts/ingest-standards.ts --subject MAT --grade 5 --pdf data/raw/matematicas.pdf
 */

type Args = { subject: string; grade: string; pdf: string };

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const subject = get("--subject");
  const grade = get("--grade");
  const pdf = get("--pdf");
  if (!subject || !grade || !pdf) {
    throw new Error(
      "Uso: npx tsx scripts/ingest-standards.ts --subject <COD> --grade <K|1..12> --pdf <ruta.pdf>",
    );
  }
  return { subject, grade, pdf };
}

const StructurePrompt = (grade: string, text: string) => `Eres un especialista en currículo del Departamento de Educación de Puerto Rico.
A partir del siguiente texto extraído de un documento oficial de "Estándares de Contenido y
Expectativas de Grado", extrae ÚNICAMENTE los estándares y expectativas correspondientes al
grado ${grade}.

Devuelve SOLO JSON válido con esta forma (sin texto adicional):
{
  "standards": [
    {
      "code": "string (código del estándar)",
      "description": "string",
      "expectations": [
        { "code": "string", "description": "string", "indicators": ["string", ...] }
      ]
    }
  ]
}

TEXTO:
"""
${text.slice(0, 120_000)}
"""`;

async function main() {
  const { subject, grade, pdf } = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para estructurar el PDF con Claude.");
  }

  // 1 + 2: leer y extraer texto del PDF
  const pdfParse = (await import("pdf-parse")).default;
  const buf = await fs.readFile(path.resolve(pdf));
  const { text } = await pdfParse(buf);
  console.log(`PDF leído: ${pdf} (${text.length} caracteres de texto).`);

  // 3: estructurar con Claude
  const anthropic = new Anthropic();
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16_000,
    messages: [{ role: "user", content: StructurePrompt(grade, text) }],
  });
  const raw = msg.content.find((b) => b.type === "text")?.text ?? "{}";
  const json = JSON.parse(raw.replace(/^```json\n?|\n?```$/g, "").trim());

  // 4: insertar en la base
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
  });
  const subj = await prisma.subject.findUniqueOrThrow({ where: { code: subject } });
  const grd = await prisma.grade.findUniqueOrThrow({ where: { label: grade } });

  let nStd = 0;
  let nExp = 0;
  for (const std of json.standards ?? []) {
    const standard = await prisma.standard.upsert({
      where: { subjectId_gradeId_code: { subjectId: subj.id, gradeId: grd.id, code: std.code } },
      update: { description: std.description },
      create: { subjectId: subj.id, gradeId: grd.id, code: std.code, description: std.description },
    });
    nStd++;
    for (const exp of std.expectations ?? []) {
      await prisma.expectation.upsert({
        where: { standardId_code: { standardId: standard.id, code: exp.code } },
        update: { description: exp.description, indicators: exp.indicators ?? [] },
        create: {
          standardId: standard.id,
          code: exp.code,
          description: exp.description,
          indicators: exp.indicators ?? [],
        },
      });
      nExp++;
    }
  }
  console.log(`Ingesta completada: ${nStd} estándares, ${nExp} expectativas (${subject} ${grade}).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
