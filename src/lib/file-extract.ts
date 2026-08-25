export const ACCEPTED_EXTENSIONS = [".txt", ".pdf", ".docx", ".jpg", ".jpeg", ".png"] as const;

export const ACCEPT_ATTR = ".txt,.pdf,.docx,.jpg,.jpeg,.png";

export type AttachmentKind = "image" | "document";

export function classifyFile(file: File): AttachmentKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) return "image";
  if (name.endsWith(".txt") || name.endsWith(".pdf") || name.endsWith(".docx")) return "document";
  return null;
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

/** Extracts text in the browser for .txt and .docx. Returns null for formats needing the server. */
export async function extractLocally(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) {
    const text = (await file.text()).trim();
    if (!text) throw new Error(`"${file.name}" appears to be empty.`);
    return text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const result = await (
      mammoth as unknown as {
        extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      }
    ).extractRawText({ arrayBuffer });
    const text = result.value.trim();
    if (!text) throw new Error(`No text could be extracted from "${file.name}".`);
    return text;
  }
  return null;
}
