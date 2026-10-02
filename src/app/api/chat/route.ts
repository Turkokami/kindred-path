import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { maskPII } from "@/lib/safety";
import { sanitizeProfile } from "@/lib/profile";
import type { Mode } from "@/lib/content";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[]; mode?: Mode; completed?: string[]; profile?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const mode: Mode = body.mode === "prepare" ? "prepare" : "navigate";
  const completed = Array.isArray(body.completed) ? body.completed.slice(0, 100).map(String) : [];
  const profile = sanitizeProfile(body.profile, mode);
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-30)
    .map((m) => ({ role: m.role, content: maskPII(m.content.slice(0, 4000)) }));

  // The API requires the first message to come from the user.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return new Response("No message", { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "I'm not connected yet. The site owner needs to add an Anthropic API key before I can talk.",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: MODEL,
          max_tokens: 600,
          system: buildSystemPrompt(mode, completed, profile),
          messages,
        });
        s.on("text", (t) => controller.enqueue(encoder.encode(t)));
        await s.finalMessage();
      } catch (err) {
        console.error("chat error", err);
        controller.enqueue(
          encoder.encode("I'm sorry, something went wrong on my end. Please try again in a moment."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
