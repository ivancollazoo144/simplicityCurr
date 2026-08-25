"use client";

import { Printer } from "lucide-react";
import { DownloadPDFButton } from "./DownloadPDFButton";

type Props = {
  printUrl: string;
  filename: string;
};

export default function ActionButtons({ printUrl, filename }: Props) {
  return (
    <div className="flex items-center gap-2">
      <DownloadPDFButton printUrl={printUrl} filename={filename} />
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
