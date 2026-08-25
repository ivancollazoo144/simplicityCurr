"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type Props = {
  printUrl: string;
  filename: string;
};

export function DownloadPDFButton({ printUrl, filename }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const res = await fetch(printUrl, { credentials: "same-origin" });
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Remove the toolbar (print:hidden elements)
      doc.querySelectorAll('[class*="print:hidden"]').forEach((el) => el.remove());

      const main = doc.querySelector("main") ?? doc.body;

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: filename.endsWith(".pdf") ? filename : filename + ".pdf",
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
        })
        .from(main)
        .save();
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download size={13} />
      {loading ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
