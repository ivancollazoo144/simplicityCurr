"use client";

import { useState, useRef } from "react";
import { generatePracticeSetAction } from "../actions";
import GenerateButton from "@/app/components/GenerateButton";

type Lesson  = { id: string; title: string; unitTitle: string; subjectId: string; gradeId: string };
type Grade   = { id: string; label: string };
type Subject = { id: string; name: string };

export default function PracticaForm({
  grades,
  subjects,
  lessons,
}: {
  grades: Grade[];
  subjects: Subject[];
  lessons: Lesson[];
}) {
  const [source, setSource]               = useState<"topic" | "content" | "lesson">("topic");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [grade, setGrade]                 = useState("");
  const [subject, setSubject]             = useState("");
  const [pickedFile, setPickedFile]       = useState<File | null>(null);
  const [dragging, setDragging]           = useState(false);
  const fileRef                           = useRef<HTMLInputElement>(null);

  function pickLesson(l: Lesson) {
    setSelectedLesson(l);
    setGrade(l.gradeId);
    setSubject(l.subjectId);
  }

  function changeSource(s: "topic" | "content" | "lesson") {
    setSource(s);
    setSelectedLesson(null);
    setPickedFile(null);
    if (s !== "lesson") { setGrade(""); setSubject(""); }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setPickedFile(f);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setPickedFile(f);
  }

  return (
    <form action={generatePracticeSetAction} className="space-y-6">
      {/* Source selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">Fuente del contenido</label>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 p-1 gap-1">
          {(["topic", "content", "lesson"] as const).map((s) => {
            const labels = { topic: "Tema libre", content: "Texto pegado", lesson: "Desde lección" };
            return (
              <button
                key={s}
                type="button"
                onClick={() => changeSource(s)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                  source === s
                    ? "bg-white shadow-sm text-brand-teal border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic */}
      {source === "topic" && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Tema o concepto <span className="text-red-500">*</span>
          </label>
          <input
            name="topic"
            required
            type="text"
            placeholder="Ej: Multiplicación de fracciones, El sistema solar…"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      )}

      {/* Pasted content + file upload */}
      {source === "content" && (
        <div className="space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Tema <span className="text-red-500">*</span>
            </label>
            <input
              name="topic"
              required
              type="text"
              placeholder="Nombre del tema que cubre este texto"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* File upload zone */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Sube un archivo{" "}
              <span className="text-xs font-normal text-zinc-400">PDF o Word (.docx)</span>
            </label>

            {pickedFile ? (
              /* File selected state */
              <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                <span className="text-2xl">{pickedFile.name.endsWith(".pdf") ? "📄" : "📝"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{pickedFile.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(pickedFile.size / 1024).toFixed(0)} KB · el texto se extraerá al generar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPickedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-teal-100 hover:text-zinc-700"
                >
                  Quitar
                </button>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
                  dragging
                    ? "border-brand-teal bg-teal-50"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                <span className="text-3xl mb-2">📂</span>
                <p className="text-sm font-medium text-zinc-700">
                  Arrastra tu archivo aquí o{" "}
                  <span className="text-brand-teal underline">selecciona uno</span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">PDF · Word (.docx) · hasta 10 MB</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-zinc-200" />
            <span className="text-xs text-zinc-400">o pega el texto aquí</span>
            <div className="flex-1 border-t border-zinc-200" />
          </div>

          {/* Textarea */}
          <div>
            <textarea
              name="content"
              rows={6}
              disabled={!!pickedFile}
              placeholder={
                pickedFile
                  ? "Archivo seleccionado — el texto se extraerá automáticamente."
                  : "Pega aquí las notas, el texto del libro o el contenido de la lección…"
              }
              className={`w-full resize-y rounded-lg border border-zinc-300 px-3 py-2.5 text-sm leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                pickedFile ? "bg-zinc-50 text-zinc-400 cursor-not-allowed" : ""
              }`}
            />
            {!pickedFile && (
              <p className="mt-1 text-xs text-zinc-400">
                La IA usará este texto como base para generar las preguntas.
              </p>
            )}
          </div>
        </div>
      )}

      {/* From lesson */}
      {source === "lesson" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Tema <span className="text-red-500">*</span>
            </label>
            <input
              name="topic"
              required
              type="text"
              defaultValue={selectedLesson?.title ?? ""}
              key={selectedLesson?.id ?? "empty"}
              placeholder="Nombre del tema"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Lección de referencia{" "}
              <span className="text-xs font-normal text-zinc-400">(opcional — da contexto a la IA)</span>
            </label>
            {lessons.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">No tienes lecciones con plan generado todavía.</p>
            ) : (
              <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                {lessons.map((l) => (
                  <label
                    key={l.id}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition ${
                      selectedLesson?.id === l.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="lessonId"
                      value={l.id}
                      checked={selectedLesson?.id === l.id}
                      onChange={() => pickLesson(l)}
                      className="mt-0.5 accent-brand-teal"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{l.title}</p>
                      <p className="text-xs text-zinc-400">{l.unitTitle}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden fields when lesson auto-fills grade/subject */}
      {selectedLesson && (
        <>
          <input type="hidden" name="grade"   value={grade} />
          <input type="hidden" name="subject" value={subject} />
        </>
      )}

      {/* Grado + Materia — only show when not auto-filled by lesson */}
      {!selectedLesson && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Grado <span className="text-red-500">*</span>
            </label>
            <select
              name="grade"
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Selecciona…</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>Grado {g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Materia <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Selecciona…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Auto-filled grade/subject info */}
      {selectedLesson && (
        <div className="rounded-lg bg-teal-50 border border-teal-100 px-4 py-2.5 flex items-center gap-2 text-sm text-teal-800">
          <span>✓</span>
          Grado y materia tomados de la lección seleccionada.
          <button type="button" onClick={() => { setSelectedLesson(null); setGrade(""); setSubject(""); }}
            className="ml-auto text-xs underline text-teal-600 hover:text-teal-800">
            Cambiar
          </button>
        </div>
      )}

      {/* Versions */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Número de versiones{" "}
          <span className="text-xs font-normal text-zinc-400">(mismos conceptos, preguntas distintas)</span>
        </label>
        <div className="flex gap-3">
          {[2, 3].map((n) => (
            <label
              key={n}
              className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
            >
              <input type="radio" name="versions" value={n} defaultChecked={n === 2} className="accent-brand-teal" />
              <div>
                <p className="text-sm font-semibold text-zinc-900">{n} versiones</p>
                <p className="text-xs text-zinc-400">{n === 2 ? "Versión A y B" : "Versión A, B y C"}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">Idioma</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="language" value="es" defaultChecked /> Español
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="language" value="en" /> English
          </label>
        </div>
      </div>

      <GenerateButton label="Generar hojas de práctica" />
    </form>
  );
}
