import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Disclaimer,
  EditableOutput,
  ErrorState,
  GenerateButton,
  ToolHeader,
} from "@/components/tool-page";
import { askAi } from "@/lib/ai.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Academic Email Generator | JITA" },
      {
        name: "description",
        content:
          "Generate professional emails to lecturers, tutors and academic admin in a formal, polite and direct, or persuasive tone.",
      },
      { property: "og:title", content: "Academic Email Generator | JITA" },
      {
        property: "og:description",
        content: "Write clear academic emails in seconds with three tone options.",
      },
    ],
  }),
  component: EmailTool,
});

const tones = [
  { id: "Formal", hint: "Traditional and respectful" },
  { id: "Polite & Direct", hint: "Warm but to the point" },
  { id: "Persuasive", hint: "For appeals and extensions" },
] as const;

function EmailTool() {
  const ask = useServerFn(askAi);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [details, setDetails] = useState("");
  const [tone, setTone] = useState<string>("Formal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          system:
            "You are an expert academic writing assistant helping a university student write emails to academic staff. Always output a complete email starting with a 'Subject:' line, then the full body with a greeting and sign-off. Use [Your Name] and [Course Code] style placeholders only when the student has not given the detail. Do not add commentary before or after the email.",
          messages: [
            {
              role: "user" as const,
              content: `Write an academic email.\nTone: ${tone}\nRecipient and context: ${recipient}\nPurpose: ${purpose}\nKey details: ${details}`,
            },
          ],
        },
      });
      setOutput(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<Mail className="size-5" />}
        title="Smart Academic Email Generator"
        description="Draft a professional email to a lecturer, tutor or academic administrator."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient &amp; context</Label>
          <Input
            id="recipient"
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Dr. Nkosi, my Statistics 201 lecturer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Request a 3-day extension on the assignment"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="details">Key details</Label>
          <Textarea
            id="details"
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Due Friday, I was ill Monday to Wednesday and have a doctor's note, I've completed the literature review section."
          />
        </div>
        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  tone === t.id
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:bg-muted",
                )}
              >
                <span className="block font-medium">{t.id}</span>
                <span className="block text-xs text-muted-foreground">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <GenerateButton loading={loading} label="Generate email" />
      </form>

      {error && <ErrorState message={error} onRetry={() => void generate()} />}

      {output && (
        <div className="mt-6">
          <EditableOutput label="Your email" value={output} onChange={setOutput} rows={16} />
        </div>
      )}

      <Disclaimer>
        Read every email before you send it — make sure the details, dates and tone genuinely
        reflect your situation, and follow your institution&apos;s academic integrity policy on AI
        use.
      </Disclaimer>
    </DashboardLayout>
  );
}
