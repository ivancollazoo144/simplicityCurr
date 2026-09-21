"use client";

import { useFormStatus } from "react-dom";
import { ThinkingOverlay } from "./GenerateButton";

export default function CreateGeneratePlanButton({
  formAction,
}: {
  formAction: (formData: FormData) => Promise<void>;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        formAction={formAction}
        disabled={pending}
        className="rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:opacity-60"
      >
        {pending ? "Generando…" : "✦ Crear y generar plan"}
      </button>
      {pending && <ThinkingOverlay />}
    </>
  );
}
