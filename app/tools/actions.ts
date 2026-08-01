"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import { extractTextFromFile } from "@/lib/parse-file";
import { logger } from "@/lib/logger";
import {
  generateRubric,
  generateQuiz,
  generateReportCardComment,
  generateParentNote,
  generateLeveledText,
  generateComprehensionQuestions,
  generateYouTubeLesson,
  generateRealWorldConnections,
  generatePracticeSet,
} from "@/lib/generate";

export async function generateRubricAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const grade = String(formData.get("grade") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const language = (formData.get("language") ?? "es") as "es" | "en";
  const expectationIds = formData.getAll("expectationIds") as string[];

  if (!grade || !subject || !topic) throw new Error("Completa todos los campos requeridos.");

  let expectationDescriptions: string[] = [];
  if (expectationIds.length) {
    const exps = await prisma.expectation.findMany({
      where: { id: { in: expectationIds } },
      select: { description: true },
    });
    expectationDescriptions = exps.map((e) => e.description);
  }

  const gradeRecord = await prisma.grade.findUnique({ where: { id: grade } });
  const subjectRecord = await prisma.subject.findUnique({ where: { id: subject } });

  const content = await generateRubric({
    grade: gradeRecord?.label ?? grade,
    subject: subjectRecord?.name ?? subject,
    topic,
    language,
    expectationDescriptions,
  });

  const title = content.title || `Rúbrica: ${topic}`;
  const output = await prisma.toolOutput.create({
    data: { type: "rubrica", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateQuizAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const grade = String(formData.get("grade") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const language = (formData.get("language") ?? "es") as "es" | "en";
  const questionCount = Number(formData.get("questionCount") ?? 10);
  const lessonId = String(formData.get("lessonId") ?? "") || undefined;

  if (!grade || !subject || !topic) throw new Error("Completa todos los campos requeridos.");

  let expectationDescriptions: string[] = [];
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: true, expectations: { include: { expectation: true } } },
    });
    if (lesson && lesson.unit.teacherId !== teacherId) throw new Error("No autorizado");
    expectationDescriptions = lesson?.expectations.map((le) => le.expectation.description) ?? [];
  }

  const gradeRecord = await prisma.grade.findUnique({ where: { id: grade } });
  const subjectRecord = await prisma.subject.findUnique({ where: { id: subject } });

  const content = await generateQuiz({
    grade: gradeRecord?.label ?? grade,
    subject: subjectRecord?.name ?? subject,
    topic,
    language,
    expectationDescriptions,
    questionCount,
  });

  const title = content.title || `Quiz: ${topic}`;
  const output = await prisma.toolOutput.create({
    data: { type: "quiz", title, teacherId, lessonId: lessonId ?? null, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateReportCardAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const studentName = String(formData.get("studentName") ?? "").trim() || "el estudiante";
  const grade = String(formData.get("grade") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const period = String(formData.get("period") ?? "1er Bimestre");
  const strengths = String(formData.get("strengths") ?? "").trim();
  const areasToImprove = String(formData.get("areasToImprove") ?? "").trim();
  const language = (formData.get("language") ?? "es") as "es" | "en";

  if (!grade || !subject || !strengths) throw new Error("Completa todos los campos requeridos.");

  const gradeRecord = await prisma.grade.findUnique({ where: { id: grade } });
  const subjectRecord = await prisma.subject.findUnique({ where: { id: subject } });

  const content = await generateReportCardComment({
    studentName,
    grade: gradeRecord?.label ?? grade,
    subject: subjectRecord?.name ?? subject,
    strengths,
    areasToImprove,
    period,
    language,
  });

  const title = `Boletín: ${studentName} — ${subjectRecord?.name ?? subject} ${period}`;
  const output = await prisma.toolOutput.create({
    data: { type: "boletin", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateParentNoteAction(formData: FormData) {
  const { teacherId, teacherName } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const studentName = String(formData.get("studentName") ?? "").trim() || "el estudiante";
  const grade = String(formData.get("grade") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const messageType = String(formData.get("messageType") ?? "informacion_general") as
    | "progreso_positivo" | "preocupacion" | "citacion" | "informacion_general";
  const details = String(formData.get("details") ?? "").trim();

  if (!grade || !subject || !details) throw new Error("Completa todos los campos requeridos.");

  const gradeRecord = await prisma.grade.findUnique({ where: { id: grade } });
  const subjectRecord = await prisma.subject.findUnique({ where: { id: subject } });

  const content = await generateParentNote({
    studentName,
    grade: gradeRecord?.label ?? grade,
    subject: subjectRecord?.name ?? subject,
    messageType,
    details,
    teacherName: teacherName ?? "El/La Maestro/a",
  });

  const typeLabel: Record<string, string> = {
    progreso_positivo: "Progreso positivo",
    preocupacion: "Preocupación",
    citacion: "Citación",
    informacion_general: "Información",
  };
  const title = `${typeLabel[messageType]}: ${studentName}`;
  const output = await prisma.toolOutput.create({
    data: { type: "comunicacion", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateLeveledTextAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const text = String(formData.get("text") ?? "").trim();
  const targetLevel = String(formData.get("targetLevel") ?? "intermedio") as
    "basico" | "intermedio" | "avanzado";
  const subject = String(formData.get("subject") ?? "") || undefined;
  const grade = String(formData.get("grade") ?? "") || undefined;

  if (!text) throw new Error("Ingresa un texto para nivelar.");

  const gradeRecord = grade ? await prisma.grade.findUnique({ where: { id: grade } }) : null;
  const subjectRecord = subject ? await prisma.subject.findUnique({ where: { id: subject } }) : null;

  const content = await generateLeveledText({
    text,
    targetLevel,
    subject: subjectRecord?.name,
    grade: gradeRecord?.label,
  });

  const levelLabel: Record<string, string> = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" };
  const title = `Texto Nivelado (${levelLabel[targetLevel]})`;
  const output = await prisma.toolOutput.create({
    data: { type: "nivelador", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateComprehensionAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const text = String(formData.get("text") ?? "").trim();
  const grade = String(formData.get("grade") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const questionCount = Number(formData.get("questionCount") ?? 5);

  if (!text || !grade || !subject) throw new Error("Completa todos los campos requeridos.");

  const gradeRecord = await prisma.grade.findUnique({ where: { id: grade } });
  const subjectRecord = await prisma.subject.findUnique({ where: { id: subject } });

  const content = await generateComprehensionQuestions({
    text,
    grade: gradeRecord?.label ?? grade,
    subject: subjectRecord?.name ?? subject,
    questionCount,
  });

  const title = `Preguntas de Comprensión — ${subjectRecord?.name ?? subject} Grado ${gradeRecord?.label ?? grade}`;
  const output = await prisma.toolOutput.create({
    data: { type: "preguntas", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateYouTubeAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const transcript = String(formData.get("transcript") ?? "").trim();
  const videoTitle = String(formData.get("videoTitle") ?? "").trim() || "Video de YouTube";
  const grade      = String(formData.get("grade")      ?? "");
  const subject    = String(formData.get("subject")    ?? "");
  const language   = (formData.get("language") ?? "es") as "es" | "en";

  if (!transcript || !grade || !subject) throw new Error("Transcripción, grado y materia son requeridos.");
  if (transcript.length < 50) throw new Error("La transcripción es demasiado corta. Copia más texto del video.");

  const [gradeRecord, subjectRecord] = await Promise.all([
    prisma.grade.findUnique({ where: { id: grade } }),
    prisma.subject.findUnique({ where: { id: subject } }),
  ]);

  const include = {
    summary:       formData.get("inc_summary")       === "on",
    vocabulary:    formData.get("inc_vocabulary")    === "on",
    comprehension: formData.get("inc_comprehension") === "on",
    discussion:    formData.get("inc_discussion")    === "on",
    activities:    formData.get("inc_activities")    === "on",
  };

  if (!Object.values(include).some(Boolean)) {
    include.summary = include.vocabulary = include.comprehension =
      include.discussion = include.activities = true;
  }

  const content = await generateYouTubeLesson({
    videoTitle,
    transcript: transcript.slice(0, 18_000),
    grade:   gradeRecord?.label  ?? grade,
    subject: subjectRecord?.name ?? subject,
    language,
    include,
  });

  const title = `YouTube: ${videoTitle}`;
  const output = await prisma.toolOutput.create({
    data: { type: "youtube", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generatePracticeSetAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const topic    = String(formData.get("topic")    ?? "").trim();
  const grade    = String(formData.get("grade")    ?? "");
  const subject  = String(formData.get("subject")  ?? "");
  const language = (formData.get("language") ?? "es") as "es" | "en";
  const versions = Number(formData.get("versions") ?? 2) as 2 | 3;
  const lessonId = String(formData.get("lessonId") ?? "") || undefined;
  const pasted   = String(formData.get("content")  ?? "").trim() || undefined;
  const file     = formData.get("file");

  if (!topic || !grade || !subject) throw new Error("Tema, grado y materia son requeridos.");

  // Build context: file upload > pasted text > lesson plan
  let context: string | undefined;
  if (file instanceof File && file.size > 0) {
    context = await extractTextFromFile(file);
    if (!context || context.length < 20) throw new Error("No se pudo extraer texto del archivo. Verifica que no esté protegido o vacío.");
    context = context.slice(0, 12_000);
  } else {
    context = pasted;
  }
  if (!context && lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { select: { teacherId: true } } },
    });
    if (lesson && lesson.unit.teacherId === teacherId && lesson.content) {
      const c = lesson.content as Record<string, unknown>;
      const overview = typeof c.overview === "string" ? c.overview : "";
      const objectives = Array.isArray(c.objectives) ? (c.objectives as string[]).join("; ") : "";
      context = [overview, objectives].filter(Boolean).join("\n");
    }
  }

  const [gradeRecord, subjectRecord] = await Promise.all([
    prisma.grade.findUnique({ where: { id: grade } }),
    prisma.subject.findUnique({ where: { id: subject } }),
  ]);

  const content = await generatePracticeSet({
    topic,
    context,
    grade:   gradeRecord?.label  ?? grade,
    subject: subjectRecord?.name ?? subject,
    versions,
    language,
  });

  const title = `Práctica: ${topic} (${versions} versiones)`;
  const output = await prisma.toolOutput.create({
    data: { type: "practica", title, teacherId, lessonId: lessonId ?? null, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function generateRealWorldAction(formData: FormData) {
  const { teacherId } = await requireSession();
  if (!checkAiRateLimit(teacherId)) throw new Error("Límite diario de generaciones alcanzado. Intenta mañana.");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY.");

  const topic    = String(formData.get("topic")    ?? "").trim();
  const grade    = String(formData.get("grade")    ?? "");
  const subject  = String(formData.get("subject")  ?? "");
  const language = (formData.get("language") ?? "es") as "es" | "en";
  const context  = String(formData.get("context")  ?? "").trim() || undefined;

  if (!topic || !grade || !subject) throw new Error("Completa todos los campos requeridos.");

  const [gradeRecord, subjectRecord] = await Promise.all([
    prisma.grade.findUnique({ where: { id: grade } }),
    prisma.subject.findUnique({ where: { id: subject } }),
  ]);

  const content = await generateRealWorldConnections({
    topic,
    grade:   gradeRecord?.label  ?? grade,
    subject: subjectRecord?.name ?? subject,
    language,
    context,
  });

  const title = `Mundo Real: ${topic}`;
  const output = await prisma.toolOutput.create({
    data: { type: "realworld", title, teacherId, content },
  });
  redirect(`/tools/${output.id}`);
}

export async function deleteToolOutputAction(formData: FormData) {
  const { teacherId } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const output = await prisma.toolOutput.findUnique({ where: { id } });
  if (!output || output.teacherId !== teacherId) throw new Error("No autorizado.");

  await prisma.toolOutput.delete({ where: { id } });
  revalidatePath("/tools");
  redirect("/tools");
}
