import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MessagesSquare,
  Microscope,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Disclaimer, EmptyState } from "@/components/tool-page";
import { ClearDataButton } from "@/components/clear-data-button";
import { getOverview, setTaskCompleted } from "@/lib/db.functions";
import { useVisitorId } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JITA — AI Study Assistant for University Students" },
      {
        name: "description",
        content:
          "JITA helps university students write academic emails, summarize lecture notes, plan study time, understand research and chat with an AI study buddy.",
      },
      { property: "og:title", content: "JITA — AI Study Assistant" },
      {
        property: "og:description",
        content: "Academic emails, note summaries, study plans and a supportive AI study buddy.",
      },
    ],
  }),
  component: Index,
});

const tools = [
  { to: "/email", icon: Mail, title: "Smart Email Generator", text: "Professional emails in three tones." },
  { to: "/notes", icon: BookOpenCheck, title: "Notes Summarizer", text: "Clean summaries from messy notes." },
  { to: "/planner", icon: CalendarClock, title: "Study Planner", text: "A prioritized day-by-day week." },
  { to: "/research", icon: Microscope, title: "Research Assistant", text: "Plain-language explanations." },
  { to: "/chat", icon: MessagesSquare, title: "Study Buddy", text: "Talk through what you're stuck on." },
  { to: "/calendar", icon: CalendarDays, title: "Calendar", text: "See deadlines and study sessions." },
] as const;

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-primary/10 text-primary",
  Low: "bg-muted text-muted-foreground",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Index() {
  const visitorId = useVisitorId();
  const load = useServerFn(getOverview);
  const toggle = useServerFn(setTaskCompleted);
  const queryClient = useQueryClient();

  const overview = useQuery({
    queryKey: ["overview", visitorId],
    queryFn: () => load({ data: { visitorId } }),
    enabled: Boolean(visitorId),
  });

  const data = overview.data;
  const done = data?.tasks.completed ?? 0;
  const total = data?.tasks.total ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const isNew = Boolean(
    data &&
      !data.counts.emails &&
      !data.counts.notes &&
      !data.counts.research &&
      !data.counts.plans &&
      !data.counts.chats,
  );

  async function complete(id: string) {
    if (!visitorId) return;
    await toggle({ data: { visitorId, id, completed: true } });
    void queryClient.invalidateQueries({ queryKey: ["overview", visitorId] });
    void queryClient.invalidateQueries({ queryKey: ["tasks", visitorId] });
  }

  const stats = [
    { label: "Emails drafted", value: data?.counts.emails ?? 0 },
    { label: "Notes summarized", value: data?.counts.notes ?? 0 },
    { label: "Study hours planned", value: data?.studyHours ?? 0 },
    { label: "Topics researched", value: data?.counts.research ?? 0 },
  ];

  return (
    <DashboardLayout>
      <section className="rounded-2xl bg-gradient-hero p-8 text-primary-foreground sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" /> Powered by AI
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()} — let&apos;s make this a good study day.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          {isNew
            ? "You're new here. Pick a tool below and JITA will start keeping track of your work — no account needed."
            : "Everything you generate is saved automatically on this device, so you can pick up where you left off."}
        </p>
        <Link
          to="/planner"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Plan my week
        </Link>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-2xl font-bold tabular-nums">
              {overview.isLoading && visitorId ? "—" : s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Study progress</h2>
          <span className="text-sm text-muted-foreground">
            {done}/{total} tasks complete
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {total
            ? `${percent}% of your planned tasks are done. Keep going!`
            : "Build a study plan and your tasks will show up here."}
        </p>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Upcoming deadlines</h2>
          <Link to="/calendar" className="text-sm text-primary hover:underline">
            View calendar
          </Link>
        </div>
        {overview.isLoading && visitorId ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your deadlines...
          </p>
        ) : data?.upcoming.length ? (
          <ul className="space-y-2">
            {data.upcoming.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.kind} · {t.due_at ? new Date(t.due_at).toLocaleString() : "No date"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      priorityStyles[t.priority] ?? priorityStyles["Low"],
                    )}
                  >
                    {t.priority}
                  </span>
                  <button
                    type="button"
                    onClick={() => void complete(t.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <CheckCircle2 className="size-4" /> Complete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CalendarClock className="size-5" />}
            title="No deadlines yet"
            text="Add your exams and due dates in the Study Planner and they'll appear here with priorities."
          />
        )}
      </section>

      <h2 className="mt-10 font-display text-lg font-semibold">Quick tools</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-soft"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold group-hover:text-primary">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JITA remembers your work with an anonymous ID stored in this browser — no signup, no
          email. You can delete everything at any time.
        </p>
        <div className="mt-4 max-w-md">
          <ClearDataButton />
        </div>
      </section>

      <Disclaimer />
    </DashboardLayout>
  );
}
