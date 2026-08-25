import type { ReactNode } from "react";
import { useState } from "react";
import { AlertTriangle, Check, Copy, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ToolHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-8 flex gap-3 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <span className="font-semibold text-foreground">Responsible AI use. </span>
        {children ??
          "JITA is a study aid meant to support your own learning, not to replace your academic work. Always review, verify and rewrite in your own words, and check your institution's academic integrity policy on AI use."}
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2 text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        {message}
      </span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function GenerateButton({
  loading,
  label = "Generate",
  disabled,
}: {
  loading: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button type="submit" size="lg" disabled={loading || disabled} className="w-full sm:w-auto">
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Generating...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function EditableOutput({
  label,
  value,
  onChange,
  rows = 10,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <CopyButton value={value} />
      </div>
      <Textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="resize-y font-normal leading-relaxed"
      />
      <p className="mt-2 text-xs text-muted-foreground">Editable — tweak before you copy or save.</p>
    </div>
  );
}
