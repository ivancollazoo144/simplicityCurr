"use client";

import { Download, Printer } from "lucide-react";
import type {
  RubricContent,
  QuizContent,
  ReportCardContent,
  ParentNoteContent,
  LeveledTextContent,
  ComprehensionContent,
  YoutubeContent,
  RealWorldContent,
  PracticeSetContent,
} from "@/lib/generate";

type Props = {
  id: string;
  title: string;
  type: string;
  content: unknown;
};

function buildText(type: string, content: unknown, title: string): string {
  const c = content as Record<string, unknown>;
  const lines: string[] = [title, ""];

  if (type === "rubrica") {
    const rc = c as unknown as RubricContent;
    if (rc.objective) lines.push(rc.objective, "");
    rc.criteria?.forEach((r) =>
      lines.push(`${r.criterion}\n  Excelente: ${r.excellent}\n  Satisfactorio: ${r.satisfactory}\n  En desarrollo: ${r.developing}\n  Insuficiente: ${r.insufficient}`)
    );
  } else if (type === "quiz") {
    const qc = c as unknown as QuizContent;
    if (qc.instructions) lines.push(qc.instructions, "");
    qc.questions?.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.text}`);
      (["A", "B", "C", "D"] as const).forEach((l) => lines.push(`   ${l}. ${q.options[l]}${q.answer === l ? " ✓" : ""}`));
      if (q.explanation) lines.push(`   Explicación: ${q.explanation}`);
      lines.push("");
    });
  } else if (type === "boletin") {
    lines.push((c as unknown as ReportCardContent).comment ?? "");
  } else if (type === "comunicacion") {
    const pc = c as unknown as ParentNoteContent;
    lines.push(`Asunto: ${pc.subject}`, "", pc.body ?? "");
  } else if (type === "nivelador") {
    const lc = c as unknown as LeveledTextContent;
    lines.push("ORIGINAL", lc.original ?? "", "", `NIVEL: ${lc.level}`, lc.leveled ?? "");
  } else if (type === "preguntas") {
    (c as unknown as ComprehensionContent).questions?.forEach((q, i) =>
      lines.push(`${i + 1}. [${q.type}] ${q.question}`, `   R: ${q.answer}`, "")
    );
  } else if (type === "youtube") {
    const yc = c as unknown as YoutubeContent;
    lines.push(yc.videoTitle ?? "", yc.videoUrl ?? "", "");
    if (yc.summary?.length) { lines.push("PUNTOS PRINCIPALES"); yc.summary.forEach((p, i) => lines.push(`${i + 1}. ${p}`)); lines.push(""); }
    if (yc.vocabulary?.length) { lines.push("VOCABULARIO"); yc.vocabulary.forEach((v) => lines.push(`${v.term}: ${v.definition}`)); lines.push(""); }
    if (yc.comprehensionQuestions?.length) { lines.push("PREGUNTAS DE COMPRENSIÓN"); yc.comprehensionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q.question}`, `   R: ${q.answer}`, "")); }
    if (yc.discussionQuestions?.length) { lines.push("DISCUSIÓN"); yc.discussionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`)); lines.push(""); }
    if (yc.activities?.length) { lines.push("ACTIVIDADES"); yc.activities.forEach((a) => lines.push(`▸ ${a.title}`, a.description, "")); }
  } else if (type === "realworld") {
    const rw = c as unknown as RealWorldContent;
    if (rw.hook) lines.push(`"${rw.hook}"`, "");
    if (rw.examples?.length) { lines.push("EJEMPLOS"); rw.examples.forEach((e) => lines.push(`▸ ${e.title}`, e.description, "")); }
    if (rw.careers?.length) { lines.push("CARRERAS"); rw.careers.forEach((cr) => lines.push(`• ${cr.title}: ${cr.how}`)); lines.push(""); }
    if (rw.everydayConnections?.length) { lines.push("CONEXIONES COTIDIANAS"); rw.everydayConnections.forEach((e) => lines.push(`✦ ${e}`)); lines.push(""); }
    if (rw.discussionStarters?.length) { lines.push("PREGUNTAS DE DISCUSIÓN"); rw.discussionStarters.forEach((q, i) => lines.push(`${i + 1}. ${q}`)); lines.push(""); }
    if (rw.challenge) lines.push("RETO", rw.challenge);
  } else if (type === "practica") {
    (c as unknown as PracticeSetContent).worksheets?.forEach((ws) => {
      lines.push(`=== Versión ${ws.version}: ${ws.title} ===`, ws.instructions ?? "", "");
      ws.questions?.forEach((q, i) => { lines.push(`${i + 1}. ${q.question}`); if (q.options) q.options.forEach((o) => lines.push(`   ${o}`)); lines.push(`   R: ${q.answer}`, ""); });
    });
  }

  return lines.join("\n");
}

export default function ToolRowActions({ id, title, type, content }: Props) {
  const handleDownload = () => {
    const text = buildText(type, content, title);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
      >
        <Download size={12} />
        Descargar
      </button>
      <a
        href={`/tools/${id}/print`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
      >
        <Printer size={12} />
        Imprimir
      </a>
    </>
  );
}
