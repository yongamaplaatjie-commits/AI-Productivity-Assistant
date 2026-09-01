import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { EmptyState, ToolHeader } from "@/components/tool-page";
import { Button } from "@/components/ui/button";
import { listTasks, setTaskCompleted } from "@/lib/db.functions";
import { useVisitorId } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Study Calendar | JITA" },
      {
        name: "description",
        content:
          "See your exams, deadlines and planned study sessions in a monthly or weekly calendar view.",
      },
      { property: "og:title", content: "Study Calendar | JITA" },
      {
        property: "og:description",
        content: "Deadlines and study sessions laid out month by month or week by week.",
      },
    ],
  }),
  component: CalendarPage,
});

type Task = {
  id: string;
  title: string;
  detail: string;
  kind: string;
  due_at: string | null;
  priority: string;
  completed: boolean;
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-primary/10 text-primary",
  Low: "bg-muted text-muted-foreground",
};

function key(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function CalendarPage() {
  const visitorId = useVisitorId();
  const load = useServerFn(listTasks);
  const toggle = useServerFn(setTaskCompleted);
  const queryClient = useQueryClient();

  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());

  const tasks = useQuery({
    queryKey: ["tasks", visitorId],
    queryFn: () => load({ data: { visitorId } }),
    enabled: Boolean(visitorId),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of (tasks.data?.items ?? []) as Task[]) {
      if (!t.due_at) continue;
      const k = key(new Date(t.due_at));
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return map;
  }, [tasks.data]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view]);

  function shift(dir: number) {
    const next = new Date(cursor);
    if (view === "week") next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCursor(next);
  }

  async function complete(t: Task) {
    if (!visitorId) return;
    await toggle({ data: { visitorId, id: t.id, completed: !t.completed } });
    void queryClient.invalidateQueries({ queryKey: ["tasks", visitorId] });
    void queryClient.invalidateQueries({ queryKey: ["overview", visitorId] });
  }

  const today = key(new Date());
  const label =
    view === "week"
      ? `Week of ${startOfWeek(cursor).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
      : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const hasAny = Boolean(tasks.data?.items.length);

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<CalendarDays className="size-5" />}
        title="Study Calendar"
        description="Your exams, deadlines and planned study sessions in one place."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-semibold">{label}</span>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex rounded-lg border border-border p-1">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {tasks.isLoading && visitorId ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your calendar...
        </p>
      ) : !hasAny ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Your calendar is empty"
          text="Generate a study plan and your deadlines and study sessions will appear here automatically."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-medium text-muted-foreground">
            {dayNames.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const k = key(d);
              const items = byDay.get(k) ?? [];
              const otherMonth = view === "month" && d.getMonth() !== cursor.getMonth();
              return (
                <div
                  key={k}
                  className={cn(
                    "min-h-24 border-b border-r border-border p-1.5 last:border-r-0 sm:min-h-28",
                    otherMonth && "bg-muted/30",
                    view === "week" && "min-h-48",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs",
                      k === today ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => void complete(t)}
                        title={`${t.title} — click to mark ${t.completed ? "incomplete" : "complete"}`}
                        className={cn(
                          "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] leading-tight",
                          priorityStyles[t.priority] ?? priorityStyles["Low"],
                          t.completed && "line-through opacity-60",
                        )}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
