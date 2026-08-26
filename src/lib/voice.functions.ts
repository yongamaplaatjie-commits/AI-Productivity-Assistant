import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TranscribeInput = z.object({
  /** Base64-encoded complete audio recording (no data URL prefix). */
  audio: z.string().min(100),
  format: z.enum(["webm", "m4a", "mp4", "wav", "mp3", "ogg"]),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Voice input is not configured. Please try again later.");

    const format = data.format === "mp4" ? "m4a" : data.format;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this recording verbatim into clear written text. Reply with the transcription only, no commentary. If nothing intelligible was said, reply exactly: NO_SPEECH_FOUND",
              },
              { type: "input_audio", input_audio: { data: data.audio, format } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429)
        throw new Error("Too many requests right now — please wait a moment and try recording again.");
      if (res.status === 402)
        throw new Error("AI credits have run out. Please add credits to continue using JITA.");
      throw new Error(`Transcription failed (${res.status}). ${body.slice(0, 160)}`);
    }

    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text || text.includes("NO_SPEECH_FOUND")) {
      throw new Error(
        "We couldn't make out any speech in that recording. Try again somewhere quieter, closer to the mic.",
      );
    }
    return { text };
  });
