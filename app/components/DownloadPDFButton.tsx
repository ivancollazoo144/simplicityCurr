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
    const wrapper = document.createElement("div");
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const res = await fetch(printUrl, { credentials: "same-origin" });
      const html = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Remove the print toolbar
      doc.querySelectorAll('[class*="print:hidden"]').forEach((el) => el.remove());

      const main = doc.querySelector("main") ?? doc.body;

      // Inject into the current document so Tailwind CSS applies
      wrapper.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:816px;background:white;z-index:-1;";
      wrapper.innerHTML = main.innerHTML;
      document.body.appendChild(wrapper);

      // Small delay so styles compute
      await new Promise((r) => setTimeout(r, 300));

      const pdfFilename = filename.endsWith(".pdf") ? filename : filename + ".pdf";

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: pdfFilename,
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
        })
        .from(wrapper)
        .save();
    } catch (e) {
      console.error("PDF generation failed", e);
      // Fallback: open print page
      window.open(printUrl, "_blank");
    } finally {
      if (wrapper.parentNode) document.body.removeChild(wrapper);
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
