"use client";

import { Printer } from "lucide-react";
import { DownloadPDFButton } from "@/app/components/DownloadPDFButton";

type Props = {
  id: string;
  title: string;
};

export default function ToolRowActions({ id, title }: Props) {
  return (
    <>
      <DownloadPDFButton
        printUrl={`/tools/${id}/print`}
        filename={title.replace(/\s+/g, "_")}
      />
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
