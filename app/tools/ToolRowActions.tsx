"use client";

import { Download, Printer } from "lucide-react";

type Props = {
  id: string;
};

export default function ToolRowActions({ id }: Props) {
  return (
    <>
      <a
        href={`/tools/${id}/print?auto=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
      >
        <Download size={12} />
        Descargar PDF
      </a>
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
