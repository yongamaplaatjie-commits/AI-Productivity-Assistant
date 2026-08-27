import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/voice.functions";

type Format = "webm" | "m4a" | "mp4" | "wav" | "mp3" | "ogg";

function formatFrom(mimeType: string): Format {
  const m = mimeType.toLowerCase();
  if (m.includes("mp4")) return "mp4";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("ogg")) return "ogg";
  return "webm";
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

/** Records from the mic and hands the transcription back to the caller. */
export function VoiceButton({
  onText,
  label = "Speak",
  disabled,
}: {
  onText: (text: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const transcribe = useServerFn(transcribeAudio);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          if (blob.size < 1000) throw new Error("That recording was too short — try again.");
          const audio = await toBase64(blob);
          const res = await transcribe({
            data: { audio, format: formatFrom(recorder.mimeType || "audio/webm") },
          });
          onText(res.text);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not transcribe that recording.");
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("We couldn't access your microphone. Check your browser permissions and try again.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        disabled={disabled || busy}
        onClick={() => (recording ? stop() : void start())}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Transcribing...
          </>
        ) : recording ? (
          <>
            <Square className="size-4" /> Stop recording
          </>
        ) : (
          <>
            <Mic className="size-4" /> {label}
          </>
        )}
      </Button>
      {recording && (
        <p className="text-xs text-muted-foreground">Listening — speak, then press stop.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
