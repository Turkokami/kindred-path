// Builds the personalized end-of-conversation summary. Claude fills a fixed JSON shape via a
// forced tool call; nothing is stored. The PDF itself is made in the person's browser.

import Anthropic from "@anthropic-ai/sdk";
import { journeyAsText, journeyFor, type Mode } from "@/lib/content";
import { isCrisis, maskPII } from "@/lib/safety";
import { SUMMARY_TOOL, cleanSummary, type Summary } from "@/lib/summary";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function systemPrompt(mode: Mode, completedTitles: string[]) {
  return `You are Wren, the AI guide for Kindred Path. The person has finished a conversation with you and wants a personal summary they can save as a PDF and bring to a professional.

${mode === "navigate" ? "They have recently lost someone. Write warmly and simply." : "They are planning ahead to protect their family."}

Fill in the save_summary tool using only what they actually said, plus the general checklist below. Rules:
- General information only. Never tell them what they "should" do about a legal choice (trusts, contesting a will, how to divide assets). Phrase steps as actions to take or questions to ask a professional.
- Never draft or include wording for wills, trusts, deeds, powers of attorney, or court forms.
- Never name, recommend, or rank a specific lawyer, firm, funeral home, or business. Name the type of professional only.
- Deadlines: give general timing and add "confirm for your state" where rules vary. Don't invent precise dates.
- Never include Social Security numbers, account numbers, card numbers, or passwords. "[redacted ...]" means they shared something sensitive that was removed.
- Plain language, short sentences, no jargon without a quick explanation.
- If they expressed thoughts of suicide or self-harm, set crisis to true.

Checklist steps already marked done: ${completedTitles.length ? completedTitles.join("; ") : "none"}.

The general checklist for reference:
${journeyAsText(mode)}`;
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ error: "forbidden" }, 403);

  let body: { messages?: ChatMessage[]; mode?: Mode; completed?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const mode: Mode = body.mode === "prepare" ? "prepare" : "navigate";
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-40)
    .map((m) => ({ role: m.role, content: maskPII(m.content.slice(0, 4000)) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.some((m) => m.role === "user")) return json({ error: "empty" }, 400);

  const doneIds = new Set(Array.isArray(body.completed) ? body.completed.map(String) : []);
  const completedTitles = journeyFor(mode)
    .flatMap((s) => s.steps)
    .filter((st) => doneIds.has(st.id))
    .map((st) => st.title);

  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "not_configured" }, 503);

  // The conversation goes in as one transcript, so the model summarizes rather than continues it.
  const transcript = messages.map((m) => `${m.role === "user" ? "Person" : "Wren"}: ${m.content}`).join("\n\n");

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt(mode, completedTitles),
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "tool", name: SUMMARY_TOOL.name },
      messages: [{ role: "user", content: `Here is our conversation. Please build my summary.\n\n${transcript}` }],
    });
    const call = res.content.find((b) => b.type === "tool_use");
    if (!call || call.type !== "tool_use") return json({ error: "summary_failed" }, 502);

    const summary: Summary = cleanSummary(call.input);
    // Belt and braces: mask anything sensitive the model let through, and keep the 988 note
    // whenever the person's own words matched the crisis check.
    const mask = (s: string) => maskPII(s);
    summary.situation = summary.situation.map(mask);
    summary.nextSteps = summary.nextSteps.map((s) => ({ step: mask(s.step), why: mask(s.why) }));
    summary.documents = summary.documents.map(mask);
    summary.crisis ||= messages.some((m) => m.role === "user" && isCrisis(m.content));
    summary.completed = Array.from(new Set([...completedTitles, ...summary.completed]));

    return json({ summary });
  } catch (err) {
    console.error("summary error", err);
    return json({ error: "summary_failed" }, 502);
  }
}
