import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessagesSquare,
  Menu,
  Microscope,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClearDataButton } from "@/components/clear-data-button";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/notes", label: "Notes Summarizer", icon: BookOpenCheck },
  { to: "/planner", label: "Study Planner", icon: CalendarClock },
  { to: "/research", label: "Research Assistant", icon: Microscope },
  { to: "/chat", label: "Study Buddy", icon: MessagesSquare },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-sidebar-foreground">
              JITA
            </span>
          </Link>
          <button
            className="text-sidebar-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-1 px-2 text-xs text-muted-foreground">Your AI study assistant</p>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-3">
          <ClearDataButton full />
        </div>

        <p className="rounded-lg bg-sidebar-accent/60 p-3 text-xs leading-relaxed text-muted-foreground">
          JITA supports your learning. Always check your institution&apos;s academic integrity
          policy on AI use.
        </p>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-lg font-bold">JITA</span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
