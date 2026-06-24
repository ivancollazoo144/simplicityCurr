import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

/**
 * Ingesta de UNA materia completa (todos los grados) desde su PDF oficial del DEPR.
 *
 * A diferencia de ingest-standards.ts (un grado a la vez con texto truncado), este script
 * recorre el documento completo en fragmentos solapados y le pide a Claude que extraiga
 * los estándares/expectativas COMPLETOS que encuentre en cada fragmento, etiquetados por
 * grado. Así se cubre el documento entero sin truncar y sin repetir el texto completo por
 * cada uno de los 13 grados.
 *
 * Uso:
 *   npx tsx scripts/ingest-subject.ts --subject CIE --pdf data/raw/ciencias.pdf [--chunk-size 100000] [--max-chunks 1]
 */

type Args = {
  subject: string;
  pdf: string;
  chunkSize: number;
  maxChunks?: number;
  start?: number;
  end?: number;
  mode: "grade" | "courses";
  courseMap?: Record<string, string>;
};

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const subject = get("--subject");
  const pdf = get("--pdf");
  const chunkSize = Number(get("--chunk-size") ?? 60_000);
  const maxChunksRaw = get("--max-chunks");
  const startRaw = get("--start");
  const endRaw = get("--end");
  const mode = (get("--mode") ?? "grade") as "grade" | "courses";
  const courseMapRaw = get("--course-map");
  if (!subject || !pdf) {
    throw new Error(
      "Uso: npx tsx scripts/ingest-subject.ts --subject <COD> --pdf <ruta.pdf> [--chunk-size N] [--max-chunks N] [--start N] [--end N] [--mode grade|courses] [--course-map JSON]",
    );
  }
  if (mode === "courses" && !courseMapRaw) {
    throw new Error('--mode courses requiere --course-map \'{"BIOLOGÍA":"10",...}\'');
  }
  return {
    subject,
    pdf,
    chunkSize,
    maxChunks: maxChunksRaw ? Number(maxChunksRaw) : undefined,
    start: startRaw ? Number(startRaw) : undefined,
    end: endRaw ? Number(endRaw) : undefined,
    mode,
    courseMap: courseMapRaw ? JSON.parse(courseMapRaw) : undefined,
  };
}

function splitIntoChunks(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

const ChunkPrompt = (subjectName: string, chunk: string) => `Eres un especialista en currículo del
Departamento de Educación de Puerto Rico (DEPR). El siguiente es UN FRAGMENTO (de varios) del texto
extraído de un documento oficial de "Estándares de Contenido y Expectativas de Grado" para la
materia "${subjectName}". El documento completo cubre los grados K a 12.

Identifica los estándares y sus expectativas de grado que aparezcan COMPLETOS dentro de este
fragmento (no incluyas uno que se vea cortado al principio o al final; aparecerá completo en otro
fragmento). Agrupa por grado usando exactamente una de estas etiquetas:
"K" (Kínder/Kindergarten), "1" (Primer grado), "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12".

Normalmente cada estándar tiene un código de 3 segmentos "ÁREA.GRADO.NÚMERO" (p.ej. "EM.5.1") y sus
expectativas códigos de 4 segmentos "ÁREA.GRADO.NÚMERO.NÚMERO" (p.ej. "EM.5.1.1").

EXCEPCIÓN: en algunas secciones (frecuente en grados de escuela superior) el documento NO tiene un
cuarto segmento — los códigos de 3 segmentos (p.ej. "EM.11.1", "EM.11.2"...) son en sí las
EXPECTATIVAS, agrupadas bajo un estándar implícito con código "ÁREA.GRADO" (p.ej. "EM.11"). En ese
caso usa como descripción del estándar el título de la sección que los antecede (el encabezado en
mayúsculas, p.ej. "LA ESTRUCTURA Y LOS NIVELES DE ORGANIZACIÓN DE LA MATERIA"). Si no hay encabezado
claro, usa "ÁREA.GRADO" como descripción del estándar.

Si el fragmento es portada, índice, introducción, glosario o no contiene estándares/expectativas
reconocibles, devuelve "entries": [].

Devuelve SOLO JSON válido (sin texto adicional, sin bloques de código):
{
  "entries": [
    {
      "grade": "5",
      "standards": [
        {
          "code": "string (código oficial del estándar)",
          "description": "string",
          "expectations": [
            { "code": "string", "description": "string", "indicators": ["string", ...] }
          ]
        }
      ]
    }
  ]
}

FRAGMENTO:
"""
${chunk}
"""`;

const CoursePrompt = (
  subjectName: string,
  courseMap: Record<string, string>,
  chunk: string,
) => `Eres un especialista en currículo del Departamento de Educación de Puerto Rico (DEPR). El
siguiente es UN FRAGMENTO (de varios) de una sección de "Estándares de Contenido y Expectativas"
para la materia "${subjectName}", organizada POR CURSO de escuela superior (no por grado escolar).

Identifica a qué curso pertenece cada estándar — por el encabezado en mayúsculas que lo antecede
(p.ej. "BIOLOGÍA", "QUÍMICA", "FÍSICA", "CIENCIAS AMBIENTALES") o, si el encabezado quedó en otro
fragmento, por el prefijo de código (p.ej. "NC.B.1" = Biología, "NC.Q.1" = Química, "NC.F.1" =
Física, "NC.CA.1" = Ciencias Ambientales). Usa este mapa de curso → etiqueta de grado para el campo
"grade":
${JSON.stringify(courseMap)}

Identifica los estándares y sus expectativas que aparezcan COMPLETOS dentro de este fragmento (no
incluyas uno que se vea cortado al principio o al final; aparecerá completo en otro fragmento).
Cada estándar tiene un código de 3 segmentos (p.ej. "NC.B.1") y sus expectativas códigos de 4
segmentos (p.ej. "NC.B.1.1").

Si el fragmento es portada, índice, glosario, apéndice, bibliografía o no contiene
estándares/expectativas reconocibles, devuelve "entries": [].

Devuelve SOLO JSON válido (sin texto adicional, sin bloques de código):
{
  "entries": [
    {
      "grade": "10",
      "standards": [
        {
          "code": "string (código oficial del estándar)",
          "description": "string",
          "expectations": [
            { "code": "string", "description": "string", "indicators": ["string", ...] }
          ]
        }
      ]
    }
  ]
}

FRAGMENTO:
"""
${chunk}
"""`;

async function main() {
  const { subject, pdf, chunkSize, maxChunks, start, end, mode, courseMap } = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para estructurar el PDF con Claude.");
  }

  const { PDFParse } = await import("pdf-parse");
  const buf = await fs.readFile(path.resolve(pdf));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const { text: fullText } = await parser.getText();
  await parser.destroy();
  console.log(`PDF leído: ${pdf} (${fullText.length} caracteres).`);

  const text = start !== undefined || end !== undefined ? fullText.slice(start ?? 0, end ?? fullText.length) : fullText;
  if (start !== undefined || end !== undefined) {
    console.log(`Rango seleccionado: ${start ?? 0}-${end ?? fullText.length} (${text.length} caracteres).`);
  }

  const overlap = 1_500;
  const chunks = splitIntoChunks(text, chunkSize, overlap);
  const limited = maxChunks ? chunks.slice(0, maxChunks) : chunks;
  console.log(
    `Dividido en ${chunks.length} fragmentos de ~${chunkSize} chars (procesando ${limited.length}).`,
  );

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
  });
  const subj = await prisma.subject.findUniqueOrThrow({ where: { code: subject } });
  const grades = await prisma.grade.findMany();
  const gradeByLabel = new Map(grades.map((g) => [g.label, g]));

  const anthropic = new Anthropic();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < limited.length; i++) {
    const chunk = limited[i];
    console.log(`\nFragmento ${i + 1}/${limited.length} (${chunk.length} chars)...`);

    const prompt =
      mode === "courses" ? CoursePrompt(subj.name, courseMap!, chunk) : ChunkPrompt(subj.name, chunk);
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 64_000,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });
    const msg = await stream.finalMessage();
    totalInputTokens += msg.usage?.input_tokens ?? 0;
    totalOutputTokens += msg.usage?.output_tokens ?? 0;

    const raw = msg.content.find((b) => b.type === "text")?.text ?? "{}";
    let json: { entries?: Array<{ grade: string; standards?: unknown[] }> };
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      json = JSON.parse(raw.slice(start, end + 1));
    } catch {
      console.warn("  ⚠️ respuesta no fue JSON válido, se omite este fragmento.");
      continue;
    }

    for (const entry of json.entries ?? []) {
      const grade = gradeByLabel.get(String(entry.grade));
      if (!grade) {
        console.warn(`  ⚠️ grado desconocido "${entry.grade}", se omite.`);
        continue;
      }
      type StdIn = {
        code: string;
        description: string;
        expectations?: Array<{ code: string; description: string; indicators?: string[] }>;
      };
      for (const std of (entry.standards ?? []) as StdIn[]) {
        const standard = await prisma.standard.upsert({
          where: { subjectId_gradeId_code: { subjectId: subj.id, gradeId: grade.id, code: std.code } },
          update: { description: std.description },
          create: { subjectId: subj.id, gradeId: grade.id, code: std.code, description: std.description },
        });
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
        }
      }
      console.log(`  grado ${entry.grade}: ${(entry.standards ?? []).length} estándar(es)`);
    }
  }

  const finalStd = await prisma.standard.count({ where: { subjectId: subj.id } });
  const finalExp = await prisma.expectation.count({ where: { standard: { subjectId: subj.id } } });
  console.log(`\nIngesta de "${subj.name}" (${subject}) completada.`);
  console.log(`Total acumulado en BD: ${finalStd} estándares, ${finalExp} expectativas.`);
  console.log(`Tokens usados: ${totalInputTokens} entrada / ${totalOutputTokens} salida.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
