import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const visitor = z.string().min(8).max(64);

const strList = z.array(z.string());

const VISITOR_TABLES = [
  "study_tasks",
  "study_plans",
  "emails",
  "note_summaries",
  "research_items",
  "chat_messages",
] as const;

type VisitorTable = (typeof VISITOR_TABLES)[number];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function fail(context: string, error: { message: string } | null) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/* ---------------------------------- emails --------------------------------- */

export const saveEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        visitorId: visitor,
        recipient: z.string(),
        purpose: z.string(),
        tone: z.string(),
        content: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("emails")
      .insert({
        visitor_id: data.visitorId,
        recipient: data.recipient,
        purpose: data.purpose,
        tone: data.tone,
        content: data.content,
      })
      .select("id")
      .single();
    fail("Could not save this email", error);
    return { id: row!.id as string };
  });

export const listEmails = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("emails")
      .select("id, recipient, purpose, tone, content, created_at")
      .eq("visitor_id", data.visitorId)
      .order("created_at", { ascending: false })
      .limit(50);
    fail("Could not load your saved emails", error);
    return { items: rows ?? [] };
  });

/* ---------------------------------- notes ---------------------------------- */

export const saveNoteSummary = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        visitorId: visitor,
        title: z.string(),
        source: z.string(),
        summary: z.string(),
        concepts: strList,
        actions: strList,
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("note_summaries")
      .insert({
        visitor_id: data.visitorId,
        title: data.title.slice(0, 120),
        source: data.source.slice(0, 20000),
        summary: data.summary,
        concepts: data.concepts,
        actions: data.actions,
      })
      .select("id")
      .single();
    fail("Could not save this summary", error);
    return { id: row!.id as string };
  });

export const listNoteSummaries = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("note_summaries")
      .select("id, title, summary, concepts, actions, created_at")
      .eq("visitor_id", data.visitorId)
      .order("created_at", { ascending: false })
      .limit(50);
    fail("Could not load your saved summaries", error);
    return { items: rows ?? [] };
  });

/* --------------------------------- research -------------------------------- */

export const saveResearch = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        visitorId: visitor,
        topic: z.string(),
        summary: z.string(),
        points: strList,
        questions: strList,
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("research_items")
      .insert({
        visitor_id: data.visitorId,
        topic: data.topic.slice(0, 500),
        summary: data.summary,
        points: data.points,
        questions: data.questions,
      })
      .select("id")
      .single();
    fail("Could not save this research summary", error);
    return { id: row!.id as string };
  });

export const listResearch = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("research_items")
      .select("id, topic, summary, points, questions, created_at")
      .eq("visitor_id", data.visitorId)
      .order("created_at", { ascending: false })
      .limit(50);
    fail("Could not load your research history", error);
    return { items: rows ?? [] };
  });

/* ---------------------------------- plans ---------------------------------- */

const TaskInput = z.object({
  title: z.string(),
  detail: z.string().optional(),
  kind: z.enum(["exam", "deadline", "session", "task"]),
  dueAt: z.string().nullable().optional(),
  priority: z.enum(["High", "Medium", "Low"]),
});

export const savePlan = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        visitorId: visitor,
        inputText: z.string(),
        hoursPerDay: z.number(),
        totalHours: z.number(),
        overview: z.string(),
        days: z.array(
          z.object({ day: z.string(), focus: z.string(), blocks: z.array(z.string()) }),
        ),
        tasks: z.array(TaskInput),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("study_plans")
      .insert({
        visitor_id: data.visitorId,
        input_text: data.inputText,
        hours_per_day: data.hoursPerDay,
        total_hours: data.totalHours,
        overview: data.overview,
        days: data.days,
      })
      .select("id")
      .single();
    fail("Could not save this plan", error);

    if (data.tasks.length) {
      const { error: taskError } = await db.from("study_tasks").insert(
        data.tasks.map((t) => ({
          visitor_id: data.visitorId,
          plan_id: row!.id as string,
          title: t.title,
          detail: t.detail ?? "",
          kind: t.kind,
          due_at: t.dueAt ?? null,
          priority: t.priority,
        })),
      );
      fail("Could not save the plan's tasks", taskError);
    }
    return { id: row!.id as string };
  });

export const listPlans = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("study_plans")
      .select("id, input_text, hours_per_day, total_hours, overview, days, created_at")
      .eq("visitor_id", data.visitorId)
      .order("created_at", { ascending: false })
      .limit(30);
    fail("Could not load your saved plans", error);
    return { items: rows ?? [] };
  });

/* ---------------------------------- tasks ---------------------------------- */

export const listTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("study_tasks")
      .select("id, plan_id, title, detail, kind, due_at, priority, completed, created_at")
      .eq("visitor_id", data.visitorId)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(500);
    fail("Could not load your tasks", error);
    return { items: rows ?? [] };
  });

export const setTaskCompleted = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ visitorId: visitor, id: z.string().uuid(), completed: z.boolean() }).parse(i),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db
      .from("study_tasks")
      .update({ completed: data.completed, completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.id)
      .eq("visitor_id", data.visitorId);
    fail("Could not update this task", error);
    return { ok: true };
  });

/* ---------------------------------- chat ----------------------------------- */

export const appendChatMessages = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        visitorId: visitor,
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    if (!data.messages.length) return { ok: true };
    const db = await admin();
    const { error } = await db
      .from("chat_messages")
      .insert(
        data.messages.map((m) => ({
          visitor_id: data.visitorId,
          role: m.role,
          content: m.content,
        })),
      );
    fail("Could not save your chat", error);
    return { ok: true };
  });

export const listChatMessages = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("visitor_id", data.visitorId)
      .order("created_at", { ascending: true })
      .limit(300);
    fail("Could not load your chat history", error);
    return { items: rows ?? [] };
  });

/* -------------------------------- overview --------------------------------- */

export const getOverview = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const v = data.visitorId;

    const count = async (table: VisitorTable) => {
      const { count: c, error } = await db
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("visitor_id", v);
      fail("Could not load your dashboard", error);
      return c ?? 0;
    };

    const [emails, notes, research, plans, chats] = await Promise.all([
      count("emails"),
      count("note_summaries"),
      count("research_items"),
      count("study_plans"),
      count("chat_messages"),
    ]);

    const { data: hoursRows, error: hoursError } = await db
      .from("study_plans")
      .select("total_hours")
      .eq("visitor_id", v);
    fail("Could not load your dashboard", hoursError);
    const studyHours = (hoursRows ?? []).reduce(
      (sum, r) => sum + Number((r as { total_hours: number }).total_hours ?? 0),
      0,
    );

    const { data: tasks, error: tasksError } = await db
      .from("study_tasks")
      .select("id, title, kind, due_at, priority, completed")
      .eq("visitor_id", v)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(500);
    fail("Could not load your dashboard", tasksError);

    const all = tasks ?? [];
    const completed = all.filter((t) => (t as { completed: boolean }).completed).length;
    const upcoming = all
      .filter((t) => !(t as { completed: boolean }).completed && (t as { due_at: string | null }).due_at)
      .slice(0, 6);

    return {
      counts: { emails, notes, research, plans, chats },
      studyHours,
      tasks: { total: all.length, completed },
      upcoming,
    };
  });

/* ------------------------------- clear data -------------------------------- */

export const clearVisitorData = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ visitorId: visitor }).parse(i))
  .handler(async ({ data }) => {
    const db = await admin();
    const tables = [
      "study_tasks",
      "study_plans",
      "emails",
      "note_summaries",
      "research_items",
      "chat_messages",
    ];
    for (const table of tables) {
      const { error } = await db.from(table).delete().eq("visitor_id", data.visitorId);
      fail("Could not delete all of your data", error);
    }
    return { ok: true };
  });
