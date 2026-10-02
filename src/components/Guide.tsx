"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar, { AvatarState } from "./Avatar";
import { Mode, journeyFor } from "@/lib/content";
import { isCrisis } from "@/lib/safety";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Record<Mode, string> = {
  navigate:
    "Hi, I'm Wren. I'm so sorry for your loss. I'm here to help you through what comes next, one small step at a time, and there's no rush. Would you like to tell me a little about who passed away and when?",
  prepare:
    "Hi, I'm Wren. Planning ahead is one of the kindest things you can do for the people you love. I'll help you understand your options and get ready to talk with an attorney. To start, what's on your mind: a will, a trust, or just figuring out where to begin?",
};

const SUGGESTIONS: Record<Mode, string[]> = {
  navigate: [
    "What do I do in the first few days?",
    "How many death certificates do I need?",
    "Do I need a lawyer?",
    "What is probate?",
  ],
  prepare: [
    "Do I need a will or a trust?",
    "How do I start a trust?",
    "What documents should everyone have?",
    "What kind of lawyer should I talk to?",
  ],
};

const CRISIS_RE =
  /\b(kill myself|suicid|end my life|want to die|don'?t want to (be here|live)|hurt myself|self[- ]harm)\b/i;

// ---------- small storage helpers (never throw) ----------
function loadDone(mode: Mode): string[] {
  try {
    const raw = localStorage.getItem(`kp-done-${mode}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveDone(mode: Mode, ids: string[]) {
  try {
    localStorage.setItem(`kp-done-${mode}`, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

// ---------- speech recognition typing (browser API) ----------
type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export default function Guide({ mode }: { mode: Mode }) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING[mode] }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [mouth, setMouth] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);

  const speakingRef = useRef(0); // utterances queued/playing
  const energyRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const recRef = useRef<SR | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voiceOnRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDone(loadDone(mode));
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setMicSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));

    const pickVoice = () => {
      if (!("speechSynthesis" in window)) return;
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      const preferred = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Moira"];
      voiceRef.current =
        preferred.map((p) => voices.find((v) => v.name.includes(p))).find(Boolean) ??
        voices.find((v) => v.lang === "en-US") ??
        voices[0] ??
        null;
    };
    pickVoice();
    if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode]);

  useEffect(() => {
    voiceOnRef.current = voiceOn;
    if (!voiceOn && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      speakingRef.current = 0;
    }
  }, [voiceOn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ---------- mouth animation loop ----------
  const animate = useCallback(() => {
    const loop = (t: number) => {
      if (speakingRef.current > 0) {
        energyRef.current = Math.max(0.45, energyRef.current * 0.94);
        const v = energyRef.current * (0.35 + 0.65 * Math.abs(Math.sin(t / 70)) * (0.7 + 0.3 * Math.sin(t / 23)));
        setMouth(v);
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setMouth(0);
        rafRef.current = null;
      }
    };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!voiceOnRef.current || !("speechSynthesis" in window) || !text.trim()) return;
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 0.95;
      u.pitch = 1.05;
      u.onstart = () => {
        energyRef.current = 1;
        setAvatarState("talking");
        animate();
      };
      u.onboundary = () => {
        energyRef.current = 1;
      };
      const finish = () => {
        speakingRef.current = Math.max(0, speakingRef.current - 1);
        if (speakingRef.current === 0) setAvatarState((s) => (s === "talking" ? "idle" : s));
      };
      u.onend = finish;
      u.onerror = finish;
      speakingRef.current += 1;
      window.speechSynthesis.speak(u);
    },
    [animate],
  );

  // ---------- send a message ----------
  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      if (isCrisis(content)) setCrisis(true);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speakingRef.current = 0;

      const next: Msg[] = [...messages, { role: "user", content }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      setAvatarState("thinking");

      let full = "";
      let spokenUpTo = 0;
      const flushSentences = (final: boolean) => {
        const rest = full.slice(spokenUpTo);
        const re = /[^.!?]+[.!?]+["')\]]?\s+/g;
        let m: RegExpExecArray | null;
        let consumed = 0;
        while ((m = re.exec(rest))) consumed = m.index + m[0].length;
        if (final) consumed = rest.length;
        if (consumed > 0) {
          speak(rest.slice(0, consumed));
          spokenUpTo += consumed;
        }
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, mode, completed: done }),
        });
        if (!res.body) throw new Error("no body");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          full += dec.decode(value, { stream: true });
          setMessages([...next, { role: "assistant", content: full }]);
          flushSentences(false);
        }
        flushSentences(true);
      } catch {
        full = "I'm sorry, I couldn't connect just now. Please check your connection and try again.";
        setMessages([...next, { role: "assistant", content: full }]);
        speak(full);
      } finally {
        setBusy(false);
        // Speech (if any) switches the avatar to "talking" when it actually starts.
        setAvatarState((s) => (s === "thinking" ? "idle" : s));
      }
    },
    [busy, messages, mode, done, speak],
  );

  // ---------- microphone ----------
  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = 0;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(finalText + interim);
    };
    rec.onend = () => {
      setListening(false);
      setAvatarState("idle");
      if (finalText.trim()) send(finalText);
    };
    rec.onerror = () => {
      setListening(false);
      setAvatarState("idle");
    };
    recRef.current = rec;
    setListening(true);
    setAvatarState("listening");
    rec.start();
  };

  const start = () => {
    setStarted(true);
    speak(GREETING[mode]);
  };

  const toggleStep = (id: string) => {
    const nextDone = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(nextDone);
    saveDone(mode, nextDone);
  };

  const journey = journeyFor(mode);
  const totalSteps = journey.reduce((n, s) => n + s.steps.length, 0);
  const doneCount = done.filter((d) => journey.some((s) => s.steps.some((st) => st.id === d))).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-6 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="font-serif text-xl text-ink">
          Kindred Path
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowList((v) => !v)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink lg:hidden"
          >
            Checklist {doneCount}/{totalSteps}
          </button>
          <button
            onClick={() => setVoiceOn((v) => !v)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink"
            aria-pressed={voiceOn}
          >
            {voiceOn ? "Voice on" : "Voice off"}
          </button>
        </div>
      </header>

      {crisis && (
        <div role="alert" className="mb-4 rounded-2xl border border-clay bg-clay-soft p-4 text-sm text-ink">
          <strong>You don&apos;t have to go through this alone.</strong> If you&apos;re thinking about suicide or
          feel unsafe, please call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline, US) or call 911 now.
          <button onClick={() => setCrisis(false)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Conversation */}
        <section className="flex min-h-0 flex-col rounded-3xl border border-line bg-card p-4 sm:p-6">
          <div className="pb-2">
            <Avatar state={avatarState} mouthOpen={mouth} />
            <p className="mt-1 text-center text-sm text-muted">
              Wren · AI guide{" "}
              {avatarState === "listening"
                ? "· listening…"
                : avatarState === "thinking"
                  ? "· thinking…"
                  : avatarState === "talking"
                    ? "· speaking"
                    : ""}
            </p>
          </div>

          {!started ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
              <p className="max-w-md text-muted">
                {mode === "navigate"
                  ? "Wren will walk with you through the next steps after a loss. You can talk out loud or type."
                  : "Wren will help you understand wills, trusts, and the documents your family will need. You can talk out loud or type."}
              </p>
              <button
                onClick={start}
                className="rounded-full bg-sage px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90"
              >
                Start talking with Wren
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="max-h-[42vh] flex-1 space-y-3 overflow-y-auto py-2 lg:max-h-[38vh]">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-md bg-sage-soft px-4 py-2.5 text-ink"
                          : "max-w-[85%] rounded-2xl rounded-bl-md border border-line px-4 py-2.5 text-ink"
                      }
                    >
                      {m.content || <span className="text-muted">…</span>}
                    </div>
                  </div>
                ))}
              </div>

              {messages.length <= 2 && (
                <div className="flex flex-wrap gap-2 py-3">
                  {SUGGESTIONS[mode].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={busy}
                      className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-sage-soft disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="mt-2 flex items-center gap-2"
              >
                {micSupported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={busy}
                    aria-label={listening ? "Stop listening" : "Talk to Wren"}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50 ${
                      listening ? "bg-clay" : "bg-sage"
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                    </svg>
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={listening ? "Listening…" : "Type or tap the mic to talk"}
                  className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-ink outline-none focus:border-sage"
                  aria-label="Your message"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="h-12 shrink-0 rounded-full bg-ink px-5 font-semibold text-white disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>

        {/* Checklist */}
        <aside className={`${showList ? "block" : "hidden"} rounded-3xl border border-line bg-card p-5 lg:block`}>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg">{mode === "navigate" ? "Your next steps" : "Your planning steps"}</h2>
            <span className="text-sm text-muted">
              {doneCount}/{totalSteps}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-soft">
            <div className="h-full bg-sage transition-all" style={{ width: `${(doneCount / totalSteps) * 100}%` }} />
          </div>
          <div className="mt-4 space-y-5">
            {journey.map((stage) => (
              <div key={stage.id}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{stage.title}</h3>
                <ul className="mt-2 space-y-2">
                  {stage.steps.map((st) => (
                    <li key={st.id}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={done.includes(st.id)}
                          onChange={() => toggleStep(st.id)}
                          className="mt-0.5 h-4 w-4 accent-[var(--sage)]"
                        />
                        <span className={done.includes(st.id) ? "text-muted line-through" : "text-ink"}>
                          {st.title}
                        </span>
                      </label>
                      {started && !done.includes(st.id) && (
                        <button
                          onClick={() => send(`Can you help me with this step: ${st.title}?`)}
                          disabled={busy}
                          className="ml-6 text-xs text-sage underline disabled:opacity-50"
                        >
                          Ask Wren
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="mt-6 text-center text-xs leading-relaxed text-muted">
        Wren is an AI guide, not a lawyer. Kindred Path is not a law firm and does not give legal, tax, or financial
        advice. Using it does not create an attorney-client relationship. Laws vary by state — confirm decisions with
        a licensed professional.
      </footer>
    </div>
  );
}
