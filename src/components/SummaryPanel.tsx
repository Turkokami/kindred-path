"use client";

import { useEffect, useRef, useState } from "react";
import { SUMMARY_DISCLAIMER, VETTING_NOTE, type Summary } from "@/lib/summary";
import type { Mode } from "@/lib/content";

type Msg = { role: "user" | "assistant"; content: string };
type Props = { open: boolean; onClose: () => void; messages: Msg[]; mode: Mode; completed: string[] };

const blobToBase64 = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

function EditableList({ items, onChange, label }: { items: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <textarea
            aria-label={`${label} ${i + 1}`}
            value={it}
            rows={Math.max(1, Math.ceil(it.length / 70))}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            className="w-full resize-y rounded-xl border border-line bg-bg px-2.5 py-1.5 text-sm text-ink"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label={`Remove ${label} ${i + 1}`}
            className="mt-1 rounded-full px-2 text-muted hover:text-clay"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function SummaryPanel({ open, onClose, messages, mode, completed }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"" | "sending" | "sent" | "error">("");
  const [emailMsg, setEmailMsg] = useState("");
  const [busyPdf, setBusyPdf] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    setStatus("loading");
    setSummary(null);
    setEmailStatus("");
    fetch("/api/summary/email")
      .then((r) => r.json())
      .then((d) => setEmailEnabled(Boolean(d.enabled)))
      .catch(() => setEmailEnabled(false));
    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, mode, completed }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.summary) throw new Error(d.error || "failed");
        setSummary(d.summary);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    // Only rebuild when the panel opens, not on every new message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch: Partial<Summary>) => setSummary((s) => (s ? { ...s, ...patch } : s));

  const makePdf = async () => {
    const { buildSummaryPdf } = await import("@/lib/summaryPdf");
    return buildSummaryPdf(summary!, mode);
  };

  const download = async () => {
    setBusyPdf(true);
    try {
      const blob = await makePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kindred-path-summary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setBusyPdf(false);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus("sending");
    setEmailMsg("");
    try {
      const pdf = await blobToBase64(await makePdf());
      const r = await fetch("/api/summary/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pdf, consent }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(typeof d.error === "string" && d.error.includes(" ") ? d.error : "We couldn't send it just now.");
      setEmailStatus("sent");
    } catch (err) {
      setEmailStatus("error");
      setEmailMsg(err instanceof Error ? err.message : "We couldn't send it just now.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl outline-none sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="summary-title" className="font-serif text-2xl text-ink">
            Your summary
          </h2>
          <button onClick={onClose} className="rounded-full border border-line px-3 py-1 text-sm text-muted">
            Close
          </button>
        </div>

        {status === "loading" && (
          <p className="mt-6 text-muted" aria-live="polite">
            Wren is putting your summary together. This takes about 15 seconds…
          </p>
        )}
        {status === "error" && (
          <p className="mt-6 text-muted">
            The summary didn&apos;t come together just now. Please close this and try again in a moment.
          </p>
        )}

        {status === "ready" && summary && (
          <>
            <p className="mt-2 text-sm text-muted">
              Review it, fix anything that&apos;s wrong, then download it. Nothing here is saved on our servers.
            </p>

            {summary.crisis && (
              <p role="alert" className="mt-4 rounded-2xl border border-clay bg-clay-soft p-3 text-sm text-ink">
                You don&apos;t have to go through this alone. If you&apos;re thinking about suicide or feel unsafe, call
                or text <strong>988</strong> or call 911.
              </p>
            )}

            <label className="mt-5 block text-sm text-muted">
              Title
              <input
                value={summary.title}
                onChange={(e) => update({ title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-line bg-bg px-2.5 py-1.5 font-serif text-lg text-ink"
              />
            </label>

            {summary.situation.length > 0 && (
              <section className="mt-5">
                <h3 className="font-serif text-lg text-ink">Your situation</h3>
                <EditableList items={summary.situation} label="situation line" onChange={(v) => update({ situation: v })} />
              </section>
            )}

            <section className="mt-5">
              <h3 className="font-serif text-lg text-ink">Your next steps</h3>
              <EditableList
                items={summary.nextSteps.map((s) => s.step)}
                label="step"
                onChange={(v) =>
                  update({ nextSteps: v.map((step, i) => ({ step, why: summary.nextSteps[i]?.why ?? "" })) })
                }
              />
            </section>

            {summary.deadlines.length > 0 && (
              <section className="mt-5">
                <h3 className="font-serif text-lg text-ink">Time-sensitive items</h3>
                <ul className="space-y-1 text-sm text-ink">
                  {summary.deadlines.map((d, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>
                        <strong>{d.item}</strong> <span className="text-muted">({d.timing})</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${d.item}`}
                        onClick={() => update({ deadlines: summary.deadlines.filter((_, j) => j !== i) })}
                        className="px-2 text-muted hover:text-clay"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.professionals.length > 0 && (
              <section className="mt-5">
                <h3 className="font-serif text-lg text-ink">Who to talk to</h3>
                {summary.professionals.map((p, i) => (
                  <div key={i} className="mt-2 rounded-2xl border border-line p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <strong className="text-ink">{p.type}</strong>
                      <button
                        type="button"
                        aria-label={`Remove ${p.type}`}
                        onClick={() => update({ professionals: summary.professionals.filter((_, j) => j !== i) })}
                        className="px-2 text-muted hover:text-clay"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-muted">{p.why}</p>
                    {p.questions.length > 0 && (
                      <ul className="mt-1 list-disc pl-5 text-ink">
                        {p.questions.map((q, k) => (
                          <li key={k}>{q}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="mt-2 text-xs text-muted">{VETTING_NOTE}</p>
              </section>
            )}

            {summary.documents.length > 0 && (
              <section className="mt-5">
                <h3 className="font-serif text-lg text-ink">Documents to gather</h3>
                <EditableList items={summary.documents} label="document" onChange={(v) => update({ documents: v })} />
              </section>
            )}

            <p className="mt-5 text-xs leading-relaxed text-muted">{SUMMARY_DISCLAIMER}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={download}
                disabled={busyPdf}
                className="rounded-full bg-sage px-6 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busyPdf ? "Making your PDF…" : "Download PDF"}
              </button>
            </div>

            {emailEnabled && (
              <form onSubmit={sendEmail} className="mt-5 border-t border-line pt-4">
                <label className="block text-sm text-muted">
                  Or email it to yourself
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-2.5 py-2 text-ink"
                  />
                </label>
                <label className="mt-2 flex items-start gap-2 text-xs text-muted">
                  <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                  Send my summary to this address. Kindred Path uses it only to send this email and doesn&apos;t keep it.
                </label>
                <button
                  type="submit"
                  disabled={emailStatus === "sending" || emailStatus === "sent"}
                  className="mt-3 rounded-full border border-sage px-5 py-2 text-sm font-semibold text-sage disabled:opacity-60"
                >
                  {emailStatus === "sending" ? "Sending…" : emailStatus === "sent" ? "Sent" : "Email me the PDF"}
                </button>
                {emailStatus === "sent" && <p className="mt-2 text-sm text-sage">Sent. Check your inbox (and spam folder).</p>}
                {emailStatus === "error" && <p className="mt-2 text-sm text-clay">{emailMsg}</p>}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
