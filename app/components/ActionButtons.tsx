"use client";

import { Download, Printer } from "lucide-react";

type Props = {
  printUrl: string;
  filename: string;
  textContent: string;
};

export default function ActionButtons({ printUrl, filename, textContent }: Props) {
  const handleDownload = () => {
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <Download size={13} />
        Descargar
      </button>
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
