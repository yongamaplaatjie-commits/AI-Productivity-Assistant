import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ExtractInput = z.object({
  name: z.string(),
  mime: z.string(),
  dataUrl: z.string().min(20),
});

export const extractFileText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured. Please try again later.");

    const isPdf = data.mime === "application/pdf";
    const content = isPdf
      ? [
          {
            type: "text",
            text: "Extract all readable text from this document, preserving structure. Reply with the text only.",
          },
          { type: "file", file: { filename: data.name, file_data: data.dataUrl } },
        ]
      : [
          {
            type: "text",
            text: "Transcribe all text and handwriting visible in this image, preserving structure and order. Reply with the transcription only. If no text is legible, reply exactly: NO_TEXT_FOUND",
          },
          { type: "image_url", image_url: { url: data.dataUrl } },
        ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429)
        throw new Error("Too many requests right now — please wait a moment and retry.");
      if (res.status === 402)
        throw new Error("AI credits have run out. Please add credits to continue using JITA.");
      throw new Error(
        `Could not read "${data.name}" (${res.status}). ${body.slice(0, 160)}`,
      );
    }

    const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text || text.includes("NO_TEXT_FOUND")) {
      throw new Error(
        `No readable text was detected in "${data.name}". If it's a photo, try retaking it with better lighting and focus.`,
      );
    }
    return { text };
  });
