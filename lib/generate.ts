import Anthropic from "@anthropic-ai/sdk";

/** Forma del cuaderno generado (se guarda como JSON en Workbook.pages). */
export type Exercise = { prompt: string; answer: string };
export type WorkbookPage = { title: string; content: string; exercises: Exercise[] };
export type WorkbookContent = {
  title: string;
  overview: string;
  objectives: string[];
  pages: WorkbookPage[];
};

export type GenerateInput = {
  subject: string;
  grade: string;
  unitTitle: string;
  unitDescription?: string | null;
  expectations: { code: string; description: string; standard: string }[];
};

const MODEL = process.env.GENERATION_MODEL ?? "claude-opus-4-8";

const SYSTEM = `Eres un especialista en diseño curricular para escuelas de Puerto Rico.
Generas cuadernos de trabajo (workbooks) ORIGINALES para estudiantes, alineados a los Estándares de
Contenido y Expectativas de Grado del Departamento de Educación de Puerto Rico (DEPR).

Reglas:
- Todo el contenido debe ser ORIGINAL, escrito por ti desde cero a partir de las expectativas dadas
  y del conocimiento pedagógico general. No copies ni adaptes material de terceros.
- Escribe en español, en un registro apropiado para el grado indicado.
- Cada página debe enseñar y luego practicar: explicación breve + ejercicios con su respuesta.
- Devuelve ÚNICAMENTE JSON válido, sin texto adicional ni bloques de código.`;

function buildPrompt(input: GenerateInput): string {
  const exps = input.expectations
    .map((e) => `- ${e.code} (${e.standard}): ${e.description}`)
    .join("\n");
  return `Crea un cuaderno de trabajo para la unidad "${input.unitTitle}" de ${input.subject}, grado ${input.grade}.
${input.unitDescription ? `Descripción de la unidad: ${input.unitDescription}\n` : ""}
Expectativas del DEPR que debe cubrir:
${exps}

Genera entre 3 y 6 páginas. Devuelve JSON con esta forma EXACTA:
{
  "title": "string",
  "overview": "string (2-3 oraciones para el maestro)",
  "objectives": ["string", ...],
  "pages": [
    {
      "title": "string",
      "content": "string (explicación del concepto, puede usar saltos de línea \\n)",
      "exercises": [ { "prompt": "string", "answer": "string" }, ... ]
    }
  ]
}`;
}

function extractJson(text: string): string {
  // Si viene en un bloque ```json ... ```, toma el interior.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let s = fenced ? fenced[1] : text;
  // Recorta cualquier preámbulo/epílogo: del primer { al último }.
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return s.trim();
}

/** Genera un cuaderno con Claude. Requiere ANTHROPIC_API_KEY en el entorno. */
export async function generateWorkbook(input: GenerateInput): Promise<WorkbookContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para generar cuadernos.");
  }

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16_000,
    system: SYSTEM,
    messages: [{ role: "user", content: buildPrompt(input) }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: WorkbookContent;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    const truncated = msg.stop_reason === "max_tokens";
    throw new Error(
      truncated
        ? "La respuesta de Claude se truncó (sube max_tokens)."
        : "La respuesta de Claude no fue JSON válido. Reintenta.",
    );
  }

  // Saneo mínimo.
  parsed.title ||= input.unitTitle;
  parsed.objectives ??= [];
  parsed.pages ??= [];
  return parsed;
}
