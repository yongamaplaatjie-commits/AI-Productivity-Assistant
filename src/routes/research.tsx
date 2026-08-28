import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Microscope } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Disclaimer,
  EditableOutput,
  ErrorState,
  GenerateButton,
  HistoryItem,
  HistoryPanel,
  ToolHeader,
} from "@/components/tool-page";
import { AttachmentField, useAttachments } from "@/components/attachments";
import { VoiceButton } from "@/components/voice-recorder";
import { askAi } from "@/lib/ai.functions";
import { listResearch, saveResearch } from "@/lib/db.functions";
import { useVisitorId } from "@/lib/visitor";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | JITA" },
      {
        name: "description",
        content:
          "Understand a topic, question or article with a plain-language summary, key points and follow-up questions.",
      },
      { property: "og:title", content: "AI Research Assistant | JITA" },
      {
        property: "og:description",
        content: "A study aid for understanding topics — not for writing your assignments.",
      },
    ],
  }),
  component: ResearchTool,
});

type Result = { summary: string; points: string[]; questions: string[] };

function ResearchTool() {
  const ask = useServerFn(askAi);
  const save = useServerFn(saveResearch);
  const list = useServerFn(listResearch);
  const visitorId = useVisitorId();
  const queryClient = useQueryClient();
  const files = useAttachments();

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);

  const combined = [topic.trim(), files.combinedText].filter(Boolean).join("\n\n");

  const history = useQuery({
    queryKey: ["research", visitorId],
    queryFn: () => list({ data: { visitorId } }),
    enabled: Boolean(visitorId),
  });

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          json: true,
          system:
            'You help university students understand topics. You are a comprehension aid, never an assignment writer: explain and clarify, do not produce essay-ready prose the student could submit. Respond ONLY with JSON of the shape {"summary": string, "points": string[], "questions": string[]}. "summary" is a plain-language explanation, "points" are the key points, "questions" are 2-3 follow-up questions that push the student to think further.',
          messages: [{ role: "user" as const, content: combined }],
        },
      });
      const parsed = JSON.parse(res.text) as Result;
      const nextPoints = Array.isArray(parsed.points) ? parsed.points : [];
      const nextQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
      setSummary(parsed.summary ?? "");
      setPoints(nextPoints);
      setQuestions(nextQuestions);
      if (visitorId) {
        await save({
          data: {
            visitorId,
            topic: (topic.trim() || files.attachments[0]?.name || "Research topic").slice(0, 500),
            summary: parsed.summary ?? "",
            points: nextPoints,
            questions: nextQuestions,
          },
        });
        void queryClient.invalidateQueries({ queryKey: ["research", visitorId] });
        void queryClient.invalidateQueries({ queryKey: ["overview", visitorId] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<Microscope className="size-5" />}
        title="AI Research Assistant"
        description="Understand a topic, question or article — a study aid, not an assignment writer."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="topic">Topic, question or article text</Label>
          <Textarea
            id="topic"
            rows={10}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Explain how confidence intervals work — or paste an article you're struggling with."
          />
          <VoiceButton
            label="Ask out loud"
            onText={(t) => setTopic((prev) => (prev ? `${prev}\n${t}` : t))}
          />
        </div>

        <AttachmentField
          state={files}
          hint="Attach an article, slide deck page or photo you want explained. Max 10MB per file."
        />

        <GenerateButton
          loading={loading}
          label="Help me understand"
          disabled={!combined || files.extracting}
        />
      </form>

      {error && <ErrorState message={error} onRetry={() => void generate()} />}

      {summary && (
        <div className="mt-6 space-y-4">
          <EditableOutput label="Plain-language summary" value={summary} onChange={setSummary} rows={8} />
          <EditableOutput
            label="Key points"
            value={points.map((p) => `• ${p}`).join("\n")}
            onChange={(v) =>
              setPoints(
                v
                  .split("\n")
                  .map((l) => l.replace(/^•\s*/, ""))
                  .filter(Boolean),
              )
            }
            rows={7}
          />
          <div className="rounded-xl border border-border bg-accent/50 p-5">
            <h3 className="text-sm font-semibold">Questions to take further</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <HistoryPanel
        title="Your research history"
        loading={history.isLoading && Boolean(visitorId)}
        isEmpty={!history.data?.items.length}
        emptyTitle="Nothing researched yet"
        emptyText="Anything you ask about is saved here so you can revisit the explanation later."
      >
        {history.data?.items.map((item) => (
          <HistoryItem
            key={item.id}
            title={item.topic}
            meta={new Date(item.created_at).toLocaleString()}
            body={[
              item.summary,
              "",
              "Key points:",
              ...((item.points as string[]) ?? []).map((p) => `• ${p}`),
              "",
              "Follow-up questions:",
              ...((item.questions as string[]) ?? []).map((q) => `? ${q}`),
            ].join("\n")}
          />
        ))}
      </HistoryPanel>

      <Disclaimer>
        This tool exists to help you understand material — not to generate assignment content.
        Everything you submit should be your own work in your own words, and you should check your
        institution&apos;s academic integrity policy on AI use.
      </Disclaimer>
    </DashboardLayout>
  );
}
