import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Disclaimer,
  EditableOutput,
  ErrorState,
  GenerateButton,
  ToolHeader,
} from "@/components/tool-page";
import { askAi } from "@/lib/ai.functions";
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

function NotesTool() {
  const ask = useServerFn(askAi);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          json: true,
          system:
            'You summarize university lecture notes. Respond ONLY with JSON of the shape {"summary": string, "concepts": string[], "actions": string[]}. "summary" is a few clear paragraphs of plain language. "concepts" are the key concepts, each a short self-contained explanation. "actions" are assignments, readings and deadlines explicitly mentioned in the notes (empty array if none). Use only information present in the notes.',
          messages: [{ role: "user" as const, content: notes }],
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
        description="Paste raw notes or a transcript — get a clean summary, key concepts and action items."
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
            required
            rows={12}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your messy notes or lecture transcript here..."
          />
        </div>
        <GenerateButton loading={loading} label="Summarize notes" disabled={!notes.trim()} />
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
