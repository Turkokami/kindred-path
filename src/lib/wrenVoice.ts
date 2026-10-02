// Plays Wren's sentences in order using ElevenLabs audio from /api/tts.
// Every sentence is requested as soon as it's queued, so the next clip is usually ready
// before the current one ends. Mouth shape comes from ElevenLabs' per-character timings.
// If a clip can't be fetched or played, that sentence goes to the browser voice instead,
// and after a "not configured" answer we stop asking the server for the rest of the visit.

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};
type Clip = { url: string; align: Alignment | null };
type Item = { text: string; clip: Promise<Clip | null> };

export type WrenVoiceHooks = {
  /** Audio has started playing. */
  onStart: () => void;
  /** Nothing left to say. */
  onIdle: () => void;
  /** Speak one sentence with the browser voice; resolve when it ends. */
  fallback: (text: string) => Promise<void>;
};

/** A 0.05 s silent WAV, played on the first tap so iOS lets this element play audio later. */
function silentWav(): string {
  const samples = 400; // 8 kHz, 8-bit mono
  const b = new Uint8Array(44 + samples);
  const v = new DataView(b.buffer);
  const str = (o: number, s: string) => [...s].forEach((ch, i) => (b[o + i] = ch.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  b.fill(128, 44); // 8-bit silence is 128
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...b))}`;
}

/** How open the mouth is for a character: 0 closed (M, B, P) to 1 wide (A, O). */
function openness(ch: string): number {
  const c = ch.toLowerCase();
  if ("ao".includes(c)) return 0.92;
  if ("eiu".includes(c)) return 0.68;
  if ("mbp".includes(c)) return 0;
  if ("fv".includes(c)) return 0.25;
  if ("lrwyh".includes(c)) return 0.45;
  if (/[a-z]/.test(c)) return 0.32;
  return 0.05; // spaces and punctuation
}

function toClip(audioBase64: string, align: Alignment | null): Clip {
  const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  return { url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })), align };
}

export class WrenVoice {
  private audio: HTMLAudioElement | null = null;
  private queue: Item[] = [];
  private current: Clip | null = null;
  private running = false;
  private remoteOff = false;
  private gen = 0;
  private controller = new AbortController();
  private lastText = "";
  private stopPlayback: (() => void) | null = null;

  constructor(private hooks: WrenVoiceHooks) {}

  /** Call from a tap (the Start button) so mobile browsers allow playback later. */
  unlock() {
    if (!this.audio) this.audio = new Audio();
    this.audio.src = silentWav();
    this.audio.play().catch(() => {});
  }

  enqueue(text: string) {
    const t = text.trim();
    if (!t) return;
    const previous = this.lastText;
    this.lastText = t;
    this.queue.push({ text: t, clip: this.remoteOff ? Promise.resolve(null) : this.fetchClip(t, previous) });
    void this.pump();
  }

  /** Stop talking now and drop anything queued. */
  cancel() {
    this.gen++;
    this.controller.abort();
    this.controller = new AbortController();
    for (const item of this.queue) item.clip.then((c) => c && URL.revokeObjectURL(c.url));
    this.queue = [];
    this.lastText = "";
    this.stopPlayback?.();
  }

  /** Current mouth openness 0–1 while ElevenLabs audio plays, or null if it isn't playing. */
  mouth(): number | null {
    const a = this.audio;
    const al = this.current?.align;
    if (!a || !this.current || a.paused) return null;
    if (!al) return 0.5;
    const t = a.currentTime;
    const starts = al.character_start_times_seconds;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return t > al.character_end_times_seconds[lo] + 0.05 ? 0.05 : openness(al.characters[lo] ?? " ");
  }

  isActive() {
    return this.running;
  }

  private async fetchClip(text: string, previous: string): Promise<Clip | null> {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, previous_text: previous }),
        signal: this.controller.signal,
      });
      if (res.status === 503) {
        this.remoteOff = true;
        return null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as { audio: string; alignment: Alignment | null };
      return toClip(data.audio, data.alignment);
    } catch {
      return null;
    }
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    const g = this.gen;
    while (this.queue.length && g === this.gen) {
      const item = this.queue.shift()!;
      const clip = await item.clip;
      if (g !== this.gen) {
        if (clip) URL.revokeObjectURL(clip.url);
        break;
      }
      const played = clip ? await this.play(clip) : false;
      if (!played && g === this.gen) await this.hooks.fallback(item.text);
    }
    this.running = false;
    if (this.queue.length) void this.pump();
    else if (g === this.gen) this.hooks.onIdle();
  }

  /** Resolves true when the clip played to the end (or was cancelled), false if it couldn't play. */
  private play(clip: Clip): Promise<boolean> {
    if (!this.audio) this.audio = new Audio();
    const a = this.audio;
    return new Promise((resolve) => {
      const finish = (ok: boolean) => {
        a.onended = a.onerror = a.onplaying = null;
        this.stopPlayback = null;
        this.current = null;
        URL.revokeObjectURL(clip.url);
        resolve(ok);
      };
      this.stopPlayback = () => {
        a.pause();
        finish(true);
      };
      a.onplaying = () => this.hooks.onStart();
      a.onended = () => finish(true);
      a.onerror = () => finish(false);
      this.current = clip;
      a.src = clip.url;
      a.play().catch(() => finish(false));
    });
  }
}
