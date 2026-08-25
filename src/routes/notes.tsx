import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { BookOpenCheck, FileText, Loader2, Paperclip, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Disclaimer,
  EditableOutput,
  ErrorState,
  GenerateButton,
  ToolHeader,
} from "@/components/tool-page";
import { askAi } from "@/lib/ai.functions";
import { extractFileText } from "@/lib/extract.functions";
import {
  ACCEPT_ATTR,
  classifyFile,
  extractLocally,
  readAsDataUrl,
  type AttachmentKind,
} from "@/lib/file-extract";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Lecture Notes Summarizer | JITA" },
      {
        name: "description",
        content:
          "Paste messy lecture notes or a transcript and get a clean summary, key concepts and a list of action items.",
      },
      { property: "og:title", content: "Lecture Notes Summarizer | JITA" },
      {
        property: "og:description",
        content: "Turn raw lecture notes into a scannable summary with key concepts and to-dos.",
      },
    ],
  }),
  component: NotesTool,
});

type Parsed = { summary: string; concepts: string[]; actions: string[] };

type Attachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  previewUrl?: string | undefined;
  text: string;
};

function NotesTool() {
  const ask = useServerFn(askAi);
  const extract = useServerFn(extractFileText);
  const inputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const combined = [notes.trim(), ...attachments.map((a) => `--- ${a.name} ---\n${a.text}`)]
    .filter(Boolean)
    .join("\n\n");

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

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          json: true,
          system:
            'You summarize university lecture notes. Respond ONLY with JSON of the shape {"summary": string, "concepts": string[], "actions": string[]}. "summary" is a few clear paragraphs of plain language. "concepts" are the key concepts, each a short self-contained explanation. "actions" are assignments, readings and deadlines explicitly mentioned in the notes (empty array if none). Use only information present in the notes.',
          messages: [{ role: "user" as const, content: combined }],
        },
      });
      const parsed = JSON.parse(res.text) as Parsed;
      setSummary(parsed.summary ?? "");
      setConcepts(Array.isArray(parsed.concepts) ? parsed.concepts : []);
      setActions(Array.isArray(parsed.actions) ? parsed.actions : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<BookOpenCheck className="size-5" />}
        title="Lecture Notes Summarizer"
        description="Paste raw notes, or attach documents and photos — get a clean summary, key concepts and action items."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="notes">Your lecture notes</Label>
          <Textarea
            id="notes"
            rows={12}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your messy notes or lecture transcript here..."
          />
        </div>

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
            <span className="text-xs text-muted-foreground">
              .txt, .pdf, .docx, .jpg, .png — photos of handwritten notes work too.
            </span>
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
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <GenerateButton
          loading={loading}
          label="Summarize notes"
          disabled={!combined || extracting}
        />
      </form>


      {error && <ErrorState message={error} onRetry={() => void generate()} />}

      {summary && (
        <div className="mt-6 space-y-4">
          <EditableOutput label="Summary" value={summary} onChange={setSummary} rows={8} />
          <EditableOutput
            label="Key concepts"
            value={concepts.map((c) => `• ${c}`).join("\n")}
            onChange={(v) =>
              setConcepts(
                v
                  .split("\n")
                  .map((l) => l.replace(/^•\s*/, ""))
                  .filter(Boolean),
              )
            }
            rows={8}
          />
          <EditableOutput
            label="Action items"
            value={
              actions.length
                ? actions.map((a) => `☐ ${a}`).join("\n")
                : "No assignments, readings or deadlines were mentioned in these notes."
            }
            onChange={(v) =>
              setActions(
                v
                  .split("\n")
                  .map((l) => l.replace(/^☐\s*/, ""))
                  .filter(Boolean),
              )
            }
            rows={6}
          />
        </div>
      )}

      <Disclaimer />
    </DashboardLayout>
  );
}
