import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractFileText } from "@/lib/extract.functions";
import {
  ACCEPT_ATTR,
  classifyFile,
  extractLocally,
  formatBytes,
  isTooLarge,
  readAsDataUrl,
  type AttachmentKind,
} from "@/lib/file-extract";

export type Attachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  previewUrl?: string | undefined;
  text: string;
};

export function useAttachments() {
  const extract = useServerFn(extractFileText);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setFileError("");
    setExtracting(true);
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      const kind = classifyFile(file);
      if (!kind) {
        problems.push(`"${file.name}" isn't supported. Use .txt, .pdf, .docx, .jpg or .png.`);
        continue;
      }
      if (isTooLarge(file)) {
        problems.push(`"${file.name}" is ${formatBytes(file.size)} — the limit is 10MB per file.`);
        continue;
      }
      try {
        let text = await extractLocally(file);
        const dataUrl = await readAsDataUrl(file);
        if (text === null) {
          const res = await extract({
            data: { name: file.name, mime: file.type || "application/octet-stream", dataUrl },
          });
          text = res.text;
        }
        setAttachments((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            name: file.name,
            kind,
            previewUrl: kind === "image" ? dataUrl : undefined,
            text,
          },
        ]);
      } catch (e) {
        problems.push(
          e instanceof Error ? e.message : `Could not read "${file.name}". Please try again.`,
        );
      }
    }
    setExtracting(false);
    if (problems.length) setFileError(problems.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  }

  const combinedText = attachments
    .map((a) => `--- ${a.name} ---\n${a.text}`)
    .join("\n\n");

  return {
    attachments,
    extracting,
    fileError,
    inputRef,
    handleFiles,
    combinedText,
    remove: (id: string) => setAttachments((prev) => prev.filter((x) => x.id !== id)),
    clear: () => setAttachments([]),
  };
}

export type AttachmentsState = ReturnType<typeof useAttachments>;

export function AttachmentField({
  state,
  hint = ".txt, .pdf, .docx, .jpg, .png — photos of handwritten notes work too. Max 10MB per file.",
}: {
  state: AttachmentsState;
  hint?: string;
}) {
  const { attachments, extracting, fileError, inputRef, handleFiles, remove } = state;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={extracting}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="size-4" /> Attach file
        </Button>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>

      {extracting && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Reading your files...
        </p>
      )}

      {fileError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {fileError}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="relative flex w-40 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2"
            >
              {a.previewUrl ? (
                <img
                  src={a.previewUrl}
                  alt={`Preview of ${a.name}`}
                  className="h-24 w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <FileText className="size-7" />
                </div>
              )}
              <span className="truncate text-xs" title={a.name}>
                {a.name}
              </span>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                onClick={() => remove(a.id)}
                className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
