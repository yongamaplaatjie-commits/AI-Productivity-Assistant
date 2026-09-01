import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearVisitorData } from "@/lib/db.functions";
import { readVisitorId, resetVisitorId } from "@/lib/visitor";

export function ClearDataButton({ full = false }: { full?: boolean }) {
  const clear = useServerFn(clearVisitorData);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const visitorId = readVisitorId();
      if (visitorId) await clear({ data: { visitorId } });
      resetVisitorId();
      queryClient.clear();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your data. Please try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={full ? "w-full justify-start" : undefined}
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" /> Clear my data
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        This permanently deletes every email, summary, plan, task, research item and chat saved on
        this device. It can&apos;t be undone.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void run()}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Deleting...
            </>
          ) : (
            "Delete everything"
          )}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
