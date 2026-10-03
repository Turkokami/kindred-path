// Abuse protection for the API routes that spend money (Claude, ElevenLabs, Google, Resend):
// 1. same-origin check, 2. Vercel BotID (invisible browser check), 3. a per-visitor rate limit.
// The rate limit is in memory, so it's per server instance: a speed bump, not a hard cap.
// Hard caps belong in the Anthropic / ElevenLabs / Google consoles.
//
// The guardrail test script isn't a browser, so it sends x-guardrail-key; when that matches
// GUARDRAIL_TEST_KEY, BotID and the rate limit are skipped.

import { timingSafeEqual } from "node:crypto";
import { checkBotId } from "botid/server";

export type Limit = { max: number; windowMs: number };

export const LIMITS = {
  chat: { max: 40, windowMs: 10 * 60_000 },
  tts: { max: 300, windowMs: 10 * 60_000 },
  summary: { max: 6, windowMs: 10 * 60_000 },
  email: { max: 3, windowMs: 10 * 60_000 },
  places: { max: 30, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

const hits = new Map<string, number[]>();

function rateLimited(key: string, limit: Limit): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, ts] of hits) if (!ts.some((t) => now - t < 60 * 60_000)) hits.delete(k);
  }
  return recent.length > limit.max;
}

function isTestRequest(req: Request): boolean {
  const expected = process.env.GUARDRAIL_TEST_KEY;
  const given = req.headers.get("x-guardrail-key");
  if (!expected || !given || expected.length !== given.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}

/**
 * Returns a ready-to-send error Response if the request should be refused, or null to continue.
 * `text: true` answers in plain text (the chat UI shows the body as Wren's reply).
 */
export async function guard(
  req: Request,
  route: keyof typeof LIMITS,
  opts: { text?: boolean } = {},
): Promise<Response | null> {
  const refuse = (status: number, error: string, message: string) =>
    opts.text
      ? new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
      : Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return refuse(403, "forbidden", "Sorry, I can only talk with you on the Kindred Path site.");
  }
  if (isTestRequest(req)) return null;

  // BotID only works on Vercel (it needs Vercel's OIDC token). If it errors there, let the request
  // through and log it: a BotID outage shouldn't take Wren offline, and the rate limit still applies.
  if (process.env.VERCEL) {
    try {
      const { isBot } = await checkBotId();
      if (isBot) return refuse(403, "forbidden", "Sorry, I couldn't verify this browser. Please reload the page and try again.");
    } catch (err) {
      console.error("botid unavailable, allowing request", err instanceof Error ? err.message : err);
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (rateLimited(`${route}:${ip}`, LIMITS[route])) {
    return refuse(429, "rate_limited", "We're going a little fast. Please take a breath and try again in a few minutes.");
  }
  return null;
}
