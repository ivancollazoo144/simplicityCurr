"use client";

import { Download, Printer } from "lucide-react";

type Props = {
  printUrl: string;
  filename?: string;
  textContent?: string;
};

export default function ActionButtons({ printUrl }: Props) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`${printUrl}?auto=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <Download size={13} />
        Descargar PDF
      </a>
      <a
        href={printUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <Printer size={13} />
        Imprimir
      </a>
    </div>
  );
}
