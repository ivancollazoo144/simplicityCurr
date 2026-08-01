export async function extractTextFromFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const result = await extractText(new Uint8Array(bytes));
    return result.text.join("\n").trim();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value.trim();
  }

  if (name.endsWith(".doc")) {
    throw new Error("El formato .doc (Word antiguo) no está soportado. Guarda el archivo como .docx e intenta de nuevo.");
  }

  throw new Error("Formato de archivo no soportado. Usa PDF (.pdf) o Word (.docx).");
}
