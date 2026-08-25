import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  CalendarClock,
  Mail,
  MessagesSquare,
  Microscope,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Disclaimer } from "@/components/tool-page";

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
  {
    to: "/email",
    icon: Mail,
    title: "Smart Email Generator",
    text: "Professional emails to lecturers, tutors or admin in three tones.",
  },
  {
    to: "/notes",
    icon: BookOpenCheck,
    title: "Notes Summarizer",
    text: "Turn messy lecture notes into a clean summary, key concepts and action items.",
  },
  {
    to: "/planner",
    icon: CalendarClock,
    title: "Study Planner",
    text: "A prioritized day-by-day schedule built around your deadlines and hours.",
  },
  {
    to: "/research",
    icon: Microscope,
    title: "Research Assistant",
    text: "Plain-language explanations, key points and follow-up questions.",
  },
  {
    to: "/chat",
    icon: MessagesSquare,
    title: "Study Buddy",
    text: "A supportive chat partner when you're stuck or stressed.",
  },
] as const;

function Index() {
  return (
    <DashboardLayout>
      <section className="rounded-2xl bg-gradient-hero p-8 text-primary-foreground sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" /> Powered by AI
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Stay organized. Understand more. Communicate well.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          JITA is your calm corner of the semester — five AI tools that help you handle coursework,
          deadlines and academic communication without the overwhelm.
        </p>
        <Link
          to="/planner"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Plan my week
        </Link>
      </section>

      <h2 className="mt-10 font-display text-lg font-semibold">Your toolkit</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

      <Disclaimer />
    </DashboardLayout>
  );
}
