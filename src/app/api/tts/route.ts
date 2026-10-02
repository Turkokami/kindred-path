// Turns one sentence of Wren's reply into speech with ElevenLabs, plus per-character timings
// for lip sync. The key stays on the server. Returns 503 when not configured, and the client
// falls back to the browser's built-in voice.

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";
// Wren's voice: "Jane" in Kristofer's ElevenLabs account (tried before: Clara tMXujoAjiboschVOhAnk, Jessica r1KmysJdVYZjJCm4mL3b). ELEVENLABS_VOICE_ID overrides it.
const DEFAULT_VOICE = "RILOU7YmBhvwJGDGjNmP";
const MAX_CHARS = 600;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  const voice = process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE;
  if (!key) return json({ error: "not_configured" }, 503);
  if (/[^\x21-\x7e]/.test(key)) {
    // Usually a copied "sk_abc…" preview instead of the full key.
    console.error("tts error: ELEVENLABS_API_KEY contains a non-ASCII character (truncated copy?). Re-paste the full key.");
    return json({ error: "not_configured" }, 503);
  }

  // Only our own pages may spend ElevenLabs credits.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ error: "forbidden" }, 403);

  let body: { text?: unknown; previous_text?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS) return json({ error: "bad_request" }, 400);
  const previous = typeof body.previous_text === "string" ? body.previous_text.slice(-MAX_CHARS) : undefined;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": key },
        body: JSON.stringify({
          text,
          model_id: MODEL,
          previous_text: previous || undefined,
          // Warm and unhurried: a little expressive, a touch slower than default.
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.92 },
        }),
      },
    );
    if (!res.ok) {
      console.error("tts error", res.status, (await res.text()).slice(0, 300));
      // 401 = bad key, 402/429 = out of credits or rate limited: tell the client to stop trying.
      return json({ error: res.status === 401 || res.status === 402 ? "not_configured" : "tts_failed" }, res.status === 401 || res.status === 402 ? 503 : 502);
    }
    const data = (await res.json()) as {
      audio_base64: string;
      alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
    };
    return json({ audio: data.audio_base64, alignment: data.alignment ?? null });
  } catch (err) {
    console.error("tts error", err);
    return json({ error: "tts_failed" }, 502);
  }
}
