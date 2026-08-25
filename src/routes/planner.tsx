import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  CopyButton,
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

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Study Planner | JITA" },
      {
        name: "description",
        content:
          "Enter your exams, deadlines and available study hours and get a prioritized day-by-day study schedule.",
      },
      { property: "og:title", content: "AI Study Planner | JITA" },
      {
        property: "og:description",
        content: "A prioritized study schedule weighted by urgency, built around your real week.",
      },
    ],
  }),
  component: PlannerTool,
});

type Day = { day: string; focus: string; blocks: string[] };
type Plan = { overview: string; days: Day[] };

function PlannerTool() {
  const ask = useServerFn(askAi);
  const [deadlines, setDeadlines] = useState("");
  const [hours, setHours] = useState("3");
  const [start, setStart] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [notes, setNotes] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          json: true,
          system:
            'You are a university study planner. Respond ONLY with JSON of the shape {"overview": string, "days": [{"day": string, "focus": string, "blocks": string[]}]}. Build a 7-day prioritized schedule that respects the stated daily study hours. Rank exams and near-term deadlines above long-term coursework, include short breaks and at least one lighter day, and make each block concrete (task + duration). "overview" explains the prioritization logic in 2-4 sentences.',
          messages: [
            {
              role: "user" as const,
              content: `Deadlines, exams and coursework:\n${deadlines}\n\nAvailable study hours per day: ${hours}\nPlan starts on: ${start || "today"}`,
            },
          ],
        },
      });
      const parsed = JSON.parse(res.text) as Plan;
      setPlan(parsed);
      setNotes(parsed.overview ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const planText = plan
    ? plan.days.map((d) => `${d.day} — ${d.focus}\n${d.blocks.map((b) => `- ${b}`).join("\n")}`).join("\n\n")
    : "";

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<CalendarClock className="size-5" />}
        title="AI Study Planner"
        description="Turn your deadlines and available hours into a realistic, prioritized week."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="deadlines">Deadlines, exams &amp; coursework</Label>
          <Textarea
            id="deadlines"
            required
            rows={7}
            value={deadlines}
            onChange={(e) => setDeadlines(e.target.value)}
            placeholder={"Stats 201 exam in 6 days\nEssay for History 104 due in 2 weeks\nLab report due Thursday"}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hours">Study hours available per day</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="16"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start">Plan starts on (optional)</Label>
            <Input
              id="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Monday"
            />
          </div>
        </div>
        <GenerateButton loading={loading} label="Build my plan" disabled={!deadlines.trim()} />
      </form>

      {error && <ErrorState message={error} onRetry={() => void generate()} />}

      {plan && (
        <div className="mt-6 space-y-4">
          <EditableOutput
            label="How this plan is prioritized"
            value={notes}
            onChange={setNotes}
            rows={4}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Your week</h3>
              <CopyButton value={planText} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.days.map((d, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="font-display font-semibold">{d.day}</p>
                  <p className="mt-0.5 text-xs text-primary">{d.focus}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {d.blocks.map((b, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </DashboardLayout>
  );
}
