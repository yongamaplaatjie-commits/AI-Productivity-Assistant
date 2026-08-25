import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  system: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  json: z.boolean().optional(),
});

export const askAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured. Please try again later.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: data.system }, ...data.messages],
        ...(data.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429)
        throw new Error("Too many requests right now — please wait a moment and retry.");
      if (res.status === 402)
        throw new Error("AI credits have run out. Please add credits to continue using JITA.");
      throw new Error(`The AI service returned an error (${res.status}). ${body.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("The AI returned an empty response. Please try again.");
    return { text };
  });
