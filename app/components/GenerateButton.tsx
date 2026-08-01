"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import Image from "next/image";

const MESSAGES = [
  "Analizando los estándares del DEPR…",
  "Diseñando las actividades pedagógicas…",
  "Redactando el contenido…",
  "Aplicando el formato seleccionado…",
  "Revisando la alineación curricular…",
  "Preparando el material…",
  "Casi listo…",
];

function ThinkingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm print:hidden">
      {/* Rings */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-40 w-40 animate-ping rounded-full bg-brand-teal/10" />
        <span className="absolute h-28 w-28 animate-pulse rounded-full bg-brand/10" />

        {/* Logo card */}
        <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-100 logo-breathe">
          <Image
            src="/logo.png"
            alt="Simplicity Learning Center"
            width={160}
            height={64}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Status */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-base font-semibold text-zinc-900">Generando con IA</p>

        <p
          key={msgIndex}
          className="text-sm text-zinc-500 fade-in-msg"
        >
          {MESSAGES[msgIndex]}
        </p>

        {/* Bouncing dots */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-teal [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-teal [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

type Props = {
  label?: string;
  loadingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export default function GenerateButton({
  label = "Generar",
  loadingLabel,
  className = "w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60",
  disabled = false,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending || disabled}
        className={className}
      >
        {pending ? (loadingLabel ?? "Generando…") : label}
      </button>

      {pending && <ThinkingOverlay />}
    </>
  );
}
