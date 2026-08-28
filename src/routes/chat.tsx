import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, MessagesSquare, Send } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Disclaimer, ErrorState, ToolHeader } from "@/components/tool-page";
import { AttachmentField, useAttachments } from "@/components/attachments";
import { VoiceButton } from "@/components/voice-recorder";
import { askAi } from "@/lib/ai.functions";
import { appendChatMessages, listChatMessages } from "@/lib/db.functions";
import { useVisitorId } from "@/lib/visitor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Study Buddy | JITA" },
      {
        name: "description",
        content:
          "A supportive AI study buddy that helps university students think through coursework, stay motivated and understand difficult material.",
      },
      { property: "og:title", content: "AI Study Buddy | JITA" },
      {
        property: "og:description",
        content: "Chat through what you're stuck on with an encouraging AI study partner.",
      },
    ],
  }),
  component: ChatTool,
});

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hey! I'm your Study Buddy. Tell me what you're working on — or what's stressing you out — and we'll break it down together.",
};

const SYSTEM =
  "You are JITA's Study Buddy, a warm, encouraging study partner for university students who may be stressed or stuck. Explain concepts step by step, ask guiding questions, suggest study strategies, and normalize struggle. You help students understand material — you never write final assignment answers, essays or code submissions for them; instead you explain the approach and let them do the work. Keep replies concise and conversational.";

function ChatTool() {
  const ask = useServerFn(askAi);
  const append = useServerFn(appendChatMessages);
  const loadHistory = useServerFn(listChatMessages);
  const visitorId = useVisitorId();
  const files = useAttachments();

  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [restored, setRestored] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!visitorId || restored) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await loadHistory({ data: { visitorId } });
        if (cancelled) return;
        const items = res.items as Array<{ role: "user" | "assistant"; content: string }>;
        if (items.length) {
          setMessages([GREETING, ...items.map((m) => ({ role: m.role, content: m.content }))]);
        }
      } catch {
        /* history is a nice-to-have; the chat still works without it */
      } finally {
        if (!cancelled) setRestored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorId, restored, loadHistory]);

  async function send(history: Msg[]) {
    setLoading(true);
    setError("");
    try {
      const res = await ask({
        data: {
          system: SYSTEM,
          messages: history.slice(1).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setMessages([...history, { role: "assistant", content: res.text }]);
      const lastUser = history[history.length - 1];
      if (visitorId && lastUser?.role === "user") {
        await append({
          data: {
            visitorId,
            messages: [
              { role: "user", content: lastUser.content },
              { role: "assistant", content: res.text },
            ],
          },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    const text = [input.trim(), files.combinedText].filter(Boolean).join("\n\n");
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    files.clear();
    void send(next);
  }

  return (
    <DashboardLayout>
      <ToolHeader
        icon={<MessagesSquare className="size-5" />}
        title="AI Study Buddy"
        description="Talk it through. Here to help you understand — not to write your assignments."
      />

      <div className="flex h-[60vh] min-h-[420px] flex-col rounded-xl border border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Generating...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 border-t border-border p-3"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask anything — concepts, study tips, exam nerves..."
            className="max-h-32 min-h-11 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || (!input.trim() && !files.combinedText)}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4">
        <VoiceButton
          label="Speak to your buddy"
          onText={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))}
        />
        <AttachmentField
          state={files}
          hint="Attach notes, a problem sheet or a photo to talk through. Max 10MB per file."
        />
      </div>

      {error && (
        <ErrorState message={error} onRetry={() => void send(messages)} />
      )}

      <Disclaimer>
        Your Study Buddy is here to help you understand your work, not to produce final assignment
        answers. Verify anything factual, keep your submitted work your own, and check your
        institution&apos;s academic integrity policy on AI use.
      </Disclaimer>
    </DashboardLayout>
  );
}
