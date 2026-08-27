import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger";

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

// --- Planes de trabajo ---

export type LessonFormat = "ICAP" | "WARMUP" | "5E" | "INQUIRY" | "UDL" | "SEMANAL";

export type YouTubeResource = {
  query: string;
  url: string;
  label: string;
};

export type LessonPlanSection = {
  name: string;
  durationMinutes?: number | null;
  content: string;
  materials?: string[];
};

export type LessonPlanContent = {
  format: LessonFormat;
  title: string;
  overview: string;
  objectives: string[];
  materials: string[];
  sections: LessonPlanSection[];
  youtubeResources: YouTubeResource[];
  teacherNotes?: string | null;
  assessment?: string | null;
};

export type GenerateLessonPlanInput = {
  format: LessonFormat;
  subject: string;
  grade: string;
  lessonTitle: string;
  unitTitle: string;
  unitDescription?: string | null;
  durationMinutes?: number | null;
  expectations: { code: string; description: string; standard: string }[];
  language: "es" | "en";
};

export type GenerateLessonWorkbookInput = {
  subject: string;
  grade: string;
  lessonTitle: string;
  unitTitle: string;
  lessonPlan: LessonPlanContent;
  language: "es" | "en";
};

export type GenerateWeekWorkbookInput = {
  subject: string;
  grade: string;
  unitTitle: string;
  weekNumber?: number | null;
  lessons: { title: string; objectives: string[]; format: LessonFormat; sectionNames: string[] }[];
  expectations: { code: string; description: string; standard: string }[];
  language: "es" | "en";
};

export const FORMAT_SECTIONS: Record<LessonFormat, string[]> = {
  ICAP:    ["Objetivos", "Introducción", "Instrucción", "Práctica", "Evaluación"],
  WARMUP:  ["Warm Up", "Actividades de Clase", "Síntesis de la Lección", "Actividad de Cierre"],
  "5E":    ["Engage (Motivar)", "Explore (Explorar)", "Explain (Explicar)", "Elaborate (Elaborar)", "Evaluate (Evaluar)"],
  INQUIRY: ["Cuestionamiento", "Exploración", "Investigación"],
  UDL:     ["Compromiso (Engagement)", "Representación", "Expresión y Acción"],
  SEMANAL: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
};

const MODEL = process.env.GENERATION_MODEL ?? "claude-haiku-4-5-20251001";

async function claudeGenerate(
  system: string,
  userPrompt: string,
  maxTokens: number,
  tag: string,
): Promise<string> {
  const client = new Anthropic();
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    logger.error(`Claude API error [${tag}]`, { message: (err as Error).message });
    throw err;
  }
}

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

const LESSON_PLAN_SYSTEM = `Eres un especialista en diseño curricular para escuelas de Puerto Rico.
Creas planes de trabajo ORIGINALES para maestros, alineados a los Estándares del DEPR.
Todo el contenido debe ser original. Devuelve ÚNICAMENTE JSON válido, sin texto adicional ni bloques de código.`;

function buildLessonPlanPrompt(input: GenerateLessonPlanInput): string {
  const sections = FORMAT_SECTIONS[input.format];
  const exps = input.expectations.map((e) => `- ${e.code} (${e.standard}): ${e.description}`).join("\n");
  const lang = input.language === "en" ? "inglés" : "español";

  if (input.format === "SEMANAL") {
    return `Crea una planificación SEMANAL para "${input.lessonTitle}"
de la unidad "${input.unitTitle}" de ${input.subject}, grado ${input.grade}.
Idioma del contenido: ${lang}.

Expectativas del DEPR a cubrir durante la semana:
${exps}

Genera un plan para 5 días de clase (Lunes a Viernes). Cada día debe tener:
- Actividades concretas y variadas (no repetir el mismo tipo de actividad cada día)
- Materiales específicos del día
- Duración estimada en minutos (típicamente 45-60 min por día)
- El día debe avanzar progresivamente: Lunes = introducción/motivación, Martes-Miércoles = desarrollo/práctica,
  Jueves = profundización/aplicación, Viernes = cierre/evaluación/síntesis

Genera también 2-3 recursos de YouTube útiles para la semana.
Para cada recurso devuelve solo la consulta de búsqueda ("query") y una etiqueta descriptiva ("label").
NO incluyas el campo "url".

Devuelve JSON con esta forma EXACTA:
{
  "format": "SEMANAL",
  "title": "string",
  "overview": "string (2-3 oraciones describiendo el arco de la semana para el maestro)",
  "objectives": ["string (objetivos generales de la semana, 3-5)"],
  "materials": ["string (materiales generales de la semana)"],
  "sections": [
    { "name": "Lunes", "durationMinutes": number, "content": "string (actividades detalladas)", "materials": ["string"] },
    { "name": "Martes", "durationMinutes": number, "content": "string", "materials": ["string"] },
    { "name": "Miércoles", "durationMinutes": number, "content": "string", "materials": ["string"] },
    { "name": "Jueves", "durationMinutes": number, "content": "string", "materials": ["string"] },
    { "name": "Viernes", "durationMinutes": number, "content": "string", "materials": ["string"] }
  ],
  "youtubeResources": [{ "query": "string", "label": "string" }],
  "teacherNotes": "string_or_null",
  "assessment": "string_or_null"
}`;
  }

  return `Crea un plan de trabajo en formato ${input.format} para la lección "${input.lessonTitle}"
de la unidad "${input.unitTitle}" de ${input.subject}, grado ${input.grade}.
${input.durationMinutes ? `Duración total: ${input.durationMinutes} minutos.\n` : ""}Idioma del contenido: ${lang}.

Expectativas del DEPR a cubrir:
${exps}

El formato ${input.format} usa estas secciones EN ORDEN: ${sections.join(", ")}.
Para cada sección incluye: nombre exacto de la sección, duración estimada en minutos, descripción
detallada de actividades y materiales específicos de esa sección.

Genera también entre 3 y 5 recursos de YouTube útiles para este tema.
Para cada recurso devuelve solo la consulta de búsqueda ("query") y una etiqueta descriptiva ("label").
NO incluyas el campo "url".

Devuelve JSON con esta forma EXACTA:
{
  "format": "${input.format}",
  "title": "string",
  "overview": "string (2-3 oraciones para el maestro)",
  "objectives": ["string"],
  "materials": ["string"],
  "sections": [
    { "name": "string", "durationMinutes": number_or_null, "content": "string", "materials": ["string"] }
  ],
  "youtubeResources": [
    { "query": "string", "label": "string" }
  ],
  "teacherNotes": "string_or_null",
  "assessment": "string_or_null"
}`;
}

export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<LessonPlanContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para generar planes.");
  }
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8_000,
    system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: buildLessonPlanPrompt(input) }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  let parsed: LessonPlanContent;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error(
      msg.stop_reason === "max_tokens"
        ? "La respuesta de Claude se truncó. Reintenta."
        : "La respuesta de Claude no fue JSON válido. Reintenta.",
    );
  }
  parsed.youtubeResources = (parsed.youtubeResources ?? []).map((r) => ({
    ...r,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(r.query)}`,
  }));
  parsed.sections ??= [];
  parsed.objectives ??= [];
  parsed.materials ??= [];
  return parsed;
}

export async function generateLessonWorkbook(input: GenerateLessonWorkbookInput): Promise<WorkbookContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para generar cuadernos.");
  }
  const lang = input.language === "en" ? "inglés" : "español";
  const sectionSummaries = input.lessonPlan.sections
    .map((s) => `- ${s.name}: ${s.content.slice(0, 200)}`)
    .join("\n");
  const prompt = `Crea un cuaderno de trabajo para la lección "${input.lessonTitle}"
de la unidad "${input.unitTitle}" de ${input.subject}, grado ${input.grade}.
Idioma: ${lang}.

Objetivos de la lección:
${input.lessonPlan.objectives.map((o) => `- ${o}`).join("\n")}

Resumen del plan de trabajo (secciones):
${sectionSummaries}

El cuaderno debe practicar exactamente las habilidades cubiertas en esas secciones.
Genera entre 2 y 4 páginas. Devuelve JSON con esta forma EXACTA:
{
  "title": "string",
  "overview": "string (2-3 oraciones para el maestro)",
  "objectives": ["string"],
  "pages": [
    {
      "title": "string",
      "content": "string (explicación del concepto, puede usar saltos de línea \\n)",
      "exercises": [ { "prompt": "string", "answer": "string" } ]
    }
  ]
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16_000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  let parsed: WorkbookContent;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error(
      msg.stop_reason === "max_tokens"
        ? "La respuesta de Claude se truncó."
        : "La respuesta de Claude no fue JSON válido. Reintenta.",
    );
  }
  parsed.title ||= input.lessonTitle;
  parsed.objectives ??= [];
  parsed.pages ??= [];
  return parsed;
}

// ============================================================
// Herramientas para maestros
// ============================================================

// --- Rúbrica ---

export type RubricCriteria = {
  criterion: string;
  excellent: string;
  satisfactory: string;
  developing: string;
  insufficient: string;
};
export type RubricContent = { title: string; objective: string; criteria: RubricCriteria[] };

export type GenerateRubricInput = {
  grade: string;
  subject: string;
  topic: string;
  language: "es" | "en";
  expectationDescriptions: string[];
};

export async function generateRubric(input: GenerateRubricInput): Promise<RubricContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const lang = input.language === "en" ? "English" : "español";
  const exps = input.expectationDescriptions.length
    ? `\nExpectativas DEPR:\n${input.expectationDescriptions.map((d) => `- ${d}`).join("\n")}`
    : "";
  const prompt = `Crea una rúbrica de evaluación para la tarea/tema: "${input.topic}"
Materia: ${input.subject}. Grado: ${input.grade}. Idioma: ${lang}.${exps}

Genera entre 4 y 6 criterios de evaluación con 4 niveles: Excelente, Satisfactorio, En desarrollo, Insuficiente.
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{
  "title": "string",
  "objective": "string (propósito de la rúbrica en 1-2 oraciones)",
  "criteria": [
    {
      "criterion": "string (nombre del criterio)",
      "excellent": "string (descripción nivel Excelente)",
      "satisfactory": "string (descripción nivel Satisfactorio)",
      "developing": "string (descripción nivel En desarrollo)",
      "insufficient": "string (descripción nivel Insuficiente)"
    }
  ]
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 4_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as RubricContent;
  } catch {
    throw new Error(msg.stop_reason === "max_tokens" ? "Respuesta truncada." : "JSON inválido. Reintenta.");
  }
}

// --- Quiz de selección múltiple ---

export type QuizQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};
export type QuizContent = { title: string; instructions: string; questions: QuizQuestion[] };

export type GenerateQuizInput = {
  grade: string;
  subject: string;
  topic: string;
  language: "es" | "en";
  expectationDescriptions: string[];
  questionCount: number;
};

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const lang = input.language === "en" ? "English" : "español";
  const exps = input.expectationDescriptions.length
    ? `\nExpectativas DEPR:\n${input.expectationDescriptions.map((d) => `- ${d}`).join("\n")}`
    : "";
  const prompt = `Crea un quiz de selección múltiple sobre: "${input.topic}"
Materia: ${input.subject}. Grado: ${input.grade}. Idioma: ${lang}. Preguntas: ${input.questionCount}.${exps}

Cada pregunta tiene exactamente 4 opciones (A, B, C, D), una sola respuesta correcta y una explicación breve.
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{
  "title": "string",
  "instructions": "string (instrucciones para el estudiante)",
  "questions": [
    {
      "text": "string (enunciado de la pregunta)",
      "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
      "answer": "A" | "B" | "C" | "D",
      "explanation": "string (por qué esa respuesta es correcta)"
    }
  ]
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 6_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as QuizContent;
  } catch {
    throw new Error(msg.stop_reason === "max_tokens" ? "Respuesta truncada." : "JSON inválido. Reintenta.");
  }
}

// --- Comentarios de boletín ---

export type ReportCardContent = { comment: string };

export type GenerateReportCardInput = {
  studentName: string;
  grade: string;
  subject: string;
  strengths: string;
  areasToImprove: string;
  period: string;
  language: "es" | "en";
};

export async function generateReportCardComment(input: GenerateReportCardInput): Promise<ReportCardContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const lang = input.language === "en" ? "English" : "español";
  const prompt = `Escribe un comentario profesional de boletín escolar para un maestro.
Estudiante: ${input.studentName}. Materia: ${input.subject}. Grado: ${input.grade}. Período: ${input.period}.
Fortalezas: ${input.strengths}.
Áreas a mejorar: ${input.areasToImprove}.
Idioma: ${lang}.

El comentario debe ser de 2-3 párrafos, tono profesional y alentador, listo para copiar al boletín.
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{ "comment": "string" }`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 2_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as ReportCardContent;
  } catch {
    throw new Error("JSON inválido. Reintenta.");
  }
}

// --- Comunicación con padres ---

export type ParentNoteContent = { subject: string; body: string };

export type GenerateParentNoteInput = {
  studentName: string;
  grade: string;
  subject: string;
  messageType: "progreso_positivo" | "preocupacion" | "citacion" | "informacion_general";
  details: string;
  teacherName: string;
};

export async function generateParentNote(input: GenerateParentNoteInput): Promise<ParentNoteContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const typeLabels: Record<string, string> = {
    progreso_positivo: "compartir un progreso positivo",
    preocupacion: "expresar una preocupación académica o conductual",
    citacion: "citar a los padres/tutores a una reunión",
    informacion_general: "informar sobre actividades o cambios generales",
  };
  const prompt = `Escribe una comunicación formal de maestro a padres/tutores en español.
Propósito: ${typeLabels[input.messageType]}.
Estudiante: ${input.studentName}. Materia: ${input.subject}. Grado: ${input.grade}.
Maestro/a: ${input.teacherName}.
Detalles: ${input.details}.

Tono: profesional, respetuoso, claro. Incluye asunto y cuerpo del mensaje.
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{ "subject": "string (asunto del mensaje)", "body": "string (cuerpo completo del mensaje)" }`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 2_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as ParentNoteContent;
  } catch {
    throw new Error("JSON inválido. Reintenta.");
  }
}

// --- Nivelador de texto ---

export type LeveledTextContent = { original: string; leveled: string; level: string };

export type GenerateLeveledTextInput = {
  text: string;
  targetLevel: "basico" | "intermedio" | "avanzado";
  subject?: string;
  grade?: string;
};

export async function generateLeveledText(input: GenerateLeveledTextInput): Promise<LeveledTextContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const levelLabels: Record<string, string> = {
    basico: "básico (vocabulario simple, oraciones cortas, ideal para lectores en desarrollo)",
    intermedio: "intermedio (vocabulario apropiado para el grado, oraciones de complejidad media)",
    avanzado: "avanzado (vocabulario rico, oraciones complejas, requiere análisis)",
  };
  const context = input.subject && input.grade ? ` Contexto: ${input.subject}, grado ${input.grade}.` : "";
  const prompt = `Adapta el siguiente texto al nivel ${levelLabels[input.targetLevel]}.${context}
Mantén el mismo contenido e información, pero ajusta el vocabulario y la estructura de las oraciones al nivel indicado.
Texto original:
"""
${input.text}
"""
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{
  "original": "string (texto original sin cambios)",
  "leveled": "string (texto adaptado al nivel indicado)",
  "level": "${input.targetLevel}"
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 4_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as LeveledTextContent;
  } catch {
    throw new Error("JSON inválido. Reintenta.");
  }
}

// --- Preguntas de comprensión ---

export type ComprehensionQuestion = {
  question: string;
  type: "literal" | "inferencial" | "critica";
  answer: string;
};
export type ComprehensionContent = { questions: ComprehensionQuestion[] };

export type GenerateComprehensionInput = {
  text: string;
  grade: string;
  subject: string;
  questionCount: number;
};

export async function generateComprehensionQuestions(input: GenerateComprehensionInput): Promise<ComprehensionContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");
  const prompt = `Genera ${input.questionCount} preguntas de comprensión lectora sobre el siguiente texto.
Materia: ${input.subject}. Grado: ${input.grade}.
Incluye una mezcla de preguntas literales (la respuesta está explícita en el texto),
inferenciales (requieren deducir) y críticas (requieren opinar o evaluar).
Texto:
"""
${input.text}
"""
Devuelve ÚNICAMENTE JSON válido con esta forma EXACTA:
{
  "questions": [
    {
      "question": "string",
      "type": "literal" | "inferencial" | "critica",
      "answer": "string (respuesta esperada o guía para el maestro)"
    }
  ]
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 3_000, system: LESSON_PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(extractJson(text)) as ComprehensionContent;
  } catch {
    throw new Error("JSON inválido. Reintenta.");
  }
}

// ============================================================

export async function generateWeekWorkbook(input: GenerateWeekWorkbookInput): Promise<WorkbookContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env para generar cuadernos.");
  }
  const lang = input.language === "en" ? "inglés" : "español";
  const lessonsDesc = input.lessons
    .map(
      (l, i) =>
        `Lección ${i + 1}: "${l.title}"\n  Objetivos: ${l.objectives.join("; ")}\n  Secciones: ${l.sectionNames.join(", ")}`,
    )
    .join("\n\n");
  const weekLabel = input.weekNumber ? `Semana ${input.weekNumber}` : "Semana";
  const prompt = `Crea un cuaderno de trabajo SEMANAL para "${input.unitTitle}" de ${input.subject}, grado ${input.grade}.
${weekLabel} — ${input.lessons.length} lección(es). Idioma: ${lang}.

Lecciones de la semana:
${lessonsDesc}

Genera una sección por lección más una página final de repaso semanal.
Devuelve JSON con esta forma EXACTA:
{
  "title": "string",
  "overview": "string (2-3 oraciones para el maestro)",
  "objectives": ["string"],
  "pages": [
    {
      "title": "string",
      "content": "string",
      "exercises": [ { "prompt": "string", "answer": "string" } ]
    }
  ]
}`;
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16_000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  let parsed: WorkbookContent;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error(
      msg.stop_reason === "max_tokens"
        ? "La respuesta de Claude se truncó."
        : "La respuesta de Claude no fue JSON válido. Reintenta.",
    );
  }
  parsed.title ||= `Cuaderno ${weekLabel}: ${input.unitTitle}`;
  parsed.objectives ??= [];
  parsed.pages ??= [];
  return parsed;
}

// ── YouTube Lesson Generator ─────────────────────────────────────────────────

export type YoutubeVocab    = { term: string; definition: string };
export type YoutubeQuestion = { question: string; answer: string; level: "literal" | "inferencial" | "critica" };
export type YoutubeActivity = { title: string; description: string };

export type YoutubeContent = {
  videoUrl?: string;
  videoTitle: string;
  grade: string;
  subject: string;
  summary: string[];
  vocabulary: YoutubeVocab[];
  comprehensionQuestions: YoutubeQuestion[];
  discussionQuestions: string[];
  activities: YoutubeActivity[];
};

export type GenerateYouTubeInput = {
  videoUrl?: string;
  videoTitle: string;
  transcript: string;
  grade: string;
  subject: string;
  language: "es" | "en";
  include: {
    summary: boolean;
    vocabulary: boolean;
    comprehension: boolean;
    discussion: boolean;
    activities: boolean;
  };
};

export async function generateYouTubeLesson(input: GenerateYouTubeInput): Promise<YoutubeContent> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const lang = input.language === "en" ? "English" : "español";
  const hasTranscript = input.transcript.trim().length > 0;

  const sectionSchemas: string[] = [];
  if (input.include.summary)       sectionSchemas.push('"summary": ["string"]');
  if (input.include.vocabulary)    sectionSchemas.push('"vocabulary": [{ "term": "string", "definition": "string" }]');
  if (input.include.comprehension) sectionSchemas.push('"comprehensionQuestions": [{ "question": "string", "answer": "string", "level": "literal"|"inferencial"|"critica" }]');
  if (input.include.discussion)    sectionSchemas.push('"discussionQuestions": ["string"]');
  if (input.include.activities)    sectionSchemas.push('"activities": [{ "title": "string", "description": "string" }]');

  const contentSource = hasTranscript
    ? `TRANSCRIPCIÓN:\n"""\n${input.transcript}\n"""`
    : `TÍTULO DEL VIDEO: "${input.videoTitle}"\n(Sin transcripción disponible — infiere el contenido del título.)`;

  const prompt = `Analiza este video de YouTube y genera materiales pedagógicos para ${input.subject}, grado ${input.grade}. Responde en ${lang}.

${contentSource}

Instrucciones por sección:
- summary: 4-6 puntos principales (frases cortas)
- vocabulary: 6-10 términos clave con definición adaptada al grado
- comprehensionQuestions: 6-8 preguntas (mezcla literal, inferencial y crítica) con respuesta modelo
- discussionQuestions: 4-5 preguntas abiertas para debate en clase
- activities: 2-3 actividades de extensión con instrucciones breves

Devuelve SOLO JSON válido:
{
${sectionSchemas.join(",\n")}
}`;

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4_000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: Partial<YoutubeContent>;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("La respuesta de Claude no fue JSON válido. Reintenta.");
  }

  return {
    videoUrl:               input.videoUrl,
    videoTitle:             input.videoTitle,
    grade:                  input.grade,
    subject:                input.subject,
    summary:                parsed.summary                ?? [],
    vocabulary:             parsed.vocabulary             ?? [],
    comprehensionQuestions: parsed.comprehensionQuestions ?? [],
    discussionQuestions:    parsed.discussionQuestions    ?? [],
    activities:             parsed.activities             ?? [],
  };
}

// --- Conexiones del Mundo Real ---

export type RealWorldExample = {
  title: string;
  description: string;
  category: "aplicacion" | "carrera" | "cotidiano" | "ciencia" | "comunidad";
};

export type RealWorldContent = {
  topic: string;
  grade: string;
  subject: string;
  hook: string;
  examples: RealWorldExample[];
  careers: { title: string; how: string }[];
  everydayConnections: string[];
  discussionStarters: string[];
  challenge: string;
};

export type GenerateRealWorldInput = {
  topic: string;
  grade: string;
  subject: string;
  language: "es" | "en";
  context?: string;
};

export async function generateRealWorldConnections(
  input: GenerateRealWorldInput
): Promise<RealWorldContent> {
  const lang = input.language === "en" ? "English" : "español";

  const prompt = `Conecta el siguiente tema académico con aplicaciones del mundo real para estudiantes de ${input.subject}, grado ${input.grade}. Responde en ${lang}.

TEMA: "${input.topic}"
${input.context ? `CONTEXTO ADICIONAL: ${input.context}` : ""}

Genera contenido que ayude a los estudiantes a ver POR QUÉ este tema importa fuera del salón. Todo el contenido debe ser ORIGINAL — no copies de ninguna fuente. Adapta las conexiones a la realidad puertorriqueña cuando sea relevante.

Devuelve SOLO JSON válido con esta estructura exacta:
{
  "hook": "Pregunta o frase impactante que abre la mente del estudiante (1-2 oraciones)",
  "examples": [
    {
      "title": "Nombre corto del ejemplo",
      "description": "Cómo este tema aparece aquí (2-3 oraciones)",
      "category": "aplicacion" | "carrera" | "cotidiano" | "ciencia" | "comunidad"
    }
  ],
  "careers": [
    { "title": "Nombre de la carrera", "how": "Cómo usan este conocimiento en su trabajo" }
  ],
  "everydayConnections": ["Conexión con la vida diaria del estudiante (1 oración)"],
  "discussionStarters": ["Pregunta para iniciar discusión en clase"],
  "challenge": "Un reto o mini-proyecto que conecta el tema con el mundo real (2-3 oraciones)"
}

Requerimientos:
- examples: 5-6 ejemplos variados (mezcla de categorías)
- careers: 4-5 carreras relevantes y accesibles
- everydayConnections: 4-5 conexiones concretas
- discussionStarters: 3-4 preguntas que generen debate
- challenge: específico, factible en 1-2 clases`;

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 3_500,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: Partial<RealWorldContent>;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("La respuesta de Claude no fue JSON válido. Reintenta.");
  }

  return {
    topic:               input.topic,
    grade:               input.grade,
    subject:             input.subject,
    hook:                parsed.hook                ?? "",
    examples:            parsed.examples            ?? [],
    careers:             parsed.careers             ?? [],
    everydayConnections: parsed.everydayConnections ?? [],
    discussionStarters:  parsed.discussionStarters  ?? [],
    challenge:           parsed.challenge           ?? "",
  };
}

// --- Práctica Diferenciada ---

export type PracticeQuestion = {
  type: "multiple_choice" | "fill_blank" | "open" | "true_false";
  layout?: "vertical" | "horizontal";
  question: string;
  options?: string[];
  answer: string;
};

export type PracticeWorksheet = {
  version: string;
  title: string;
  instructions: string;
  questions: PracticeQuestion[];
};

export type PracticeSetContent = {
  topic: string;
  grade: string;
  subject: string;
  worksheets: PracticeWorksheet[];
};

export type GeneratePracticeSetInput = {
  topic: string;
  context?: string;
  grade: string;
  subject: string;
  versions: 2 | 3;
  language: "es" | "en";
};

export async function generatePracticeSet(
  input: GeneratePracticeSetInput
): Promise<PracticeSetContent> {
  const lang = input.language === "en" ? "English" : "español";
  const versionLabels = input.versions === 3 ? ["A", "B", "C"] : ["A", "B"];

  const prompt = `Genera ${input.versions} versiones de una hoja de práctica para ${input.subject}, grado ${input.grade}, sobre el tema: "${input.topic}".
${input.context ? `\nCONTENIDO DE REFERENCIA:\n"""\n${input.context.slice(0, 6000)}\n"""` : ""}

REGLAS DE FORMATO — LEE CON ATENCIÓN:

1. DETECTA el formato de presentación del tema:
   - Si dice "vertical", "en columna", "algoritmo estándar" o el contenido muestra operaciones apiladas → usa layout VERTICAL
   - Si dice "horizontal" o usa expresiones tipo "6 × 7 = ___" → usa layout HORIZONTAL
   - Para cualquier otro tema sin operaciones matemáticas → usa layout HORIZONTAL

2. FORMATO VERTICAL (para multiplicación en columnas, división larga, suma/resta en columna):
   - Pon "layout": "vertical" en la pregunta
   - El campo "question" DEBE mostrar el problema apilado usando \\n y espacios, así:
       "   247\\n×   13\\n──────"   ← multiplicación
       "   846\\n+  257\\n──────"   ← suma
       "7 ) 532"                    ← división larga
   - Alinea los dígitos a la derecha con espacios
   - Usa "──────" como línea separadora (tantos guiones como el número más largo)
   - El campo "answer" también muestra el resultado vertical con el proceso cuando aplica
   - USA SOLO "fill_blank" para preguntas verticales (el estudiante escribe el resultado debajo de la línea)

3. FORMATO HORIZONTAL: usa la expresión normal en texto, ej: "¿Cuánto es 6 × 7?"

4. OTRAS REGLAS:
   - Versiones con NÚMEROS DISTINTOS pero mismo nivel de dificultad
   - 8-10 preguntas por versión
   - Todo en ${lang}
   - Contenido 100% original

Devuelve SOLO JSON válido:
{
  "worksheets": [
    ${versionLabels.map(v => `{
      "version": "${v}",
      "title": "Título de la Versión ${v}",
      "instructions": "Instrucciones generales",
      "questions": [
        {
          "type": "fill_blank",
          "layout": "vertical",
          "question": "   247\\n×   13\\n──────",
          "answer": "3211"
        }
      ]
    }`).join(",\n    ")}
  ]
}

Nota: incluye "layout" solo cuando es "vertical". "options" solo cuando type es "multiple_choice".`;

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 6_000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: { worksheets?: PracticeWorksheet[] };
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("La respuesta de Claude no fue JSON válido. Reintenta.");
  }

  return {
    topic:      input.topic,
    grade:      input.grade,
    subject:    input.subject,
    worksheets: parsed.worksheets ?? [],
  };
}
