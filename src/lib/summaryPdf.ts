// Builds the summary PDF in the browser with jsPDF (loaded only when needed). Nothing is uploaded.

import { SUMMARY_DISCLAIMER, VETTING_NOTE, type Summary } from "./summary";

const SAGE: [number, number, number] = [95, 127, 104];
const INK: [number, number, number] = [44, 58, 51];
const MUTED: [number, number, number] = [95, 107, 100];
const CLAY: [number, number, number] = [184, 105, 77];

// jsPDF's built-in Helvetica covers Latin-1; swap the few common characters it can't draw.
const safe = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

export async function buildSummaryPdf(summary: Summary, mode: "navigate" | "prepare"): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  const width = W - M * 2;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M - 20) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) => {
    const size = opts.size ?? 11;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? INK));
    const lines = doc.splitTextToSize(safe(s), width - (opts.indent ?? 0)) as string[];
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M + (opts.indent ?? 0), y);
      y += lh;
    }
    y += opts.gap ?? 4;
  };
  const heading = (s: string) => {
    ensure(40);
    y += 10;
    text(s, { size: 14, bold: true, color: SAGE, gap: 6 });
  };
  const bullet = (s: string, sub?: string, mark = "•") => {
    ensure(18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...SAGE);
    doc.text(mark, M + 4, y);
    text(s, { indent: 18, gap: sub ? 1 : 5 });
    if (sub) text(sub, { indent: 18, size: 10, color: MUTED, gap: 6 });
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SAGE);
  doc.text("KINDRED PATH", M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W - M, y, { align: "right" });
  y += 26;
  text(summary.title, { size: 22, bold: true, gap: 6 });
  text(mode === "navigate" ? "A personal checklist for the weeks ahead" : "A personal planning checklist", { color: MUTED, gap: 10 });

  if (summary.crisis) {
    ensure(60);
    doc.setFillColor(246, 230, 221);
    const boxTop = y - 12;
    const msg = safe(
      "You don't have to go through this alone. If you are thinking about suicide or feel unsafe, call or text 988 (Suicide & Crisis Lifeline, US) or call 911.",
    );
    const lines = doc.splitTextToSize(msg, width - 20) as string[];
    doc.rect(M, boxTop, width, lines.length * 15 + 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...CLAY);
    lines.forEach((l, i) => doc.text(l, M + 10, y + 2 + i * 15));
    y = boxTop + lines.length * 15 + 30;
  }

  if (summary.situation.length) {
    heading("Your situation");
    summary.situation.forEach((s) => bullet(s));
  }
  if (summary.nextSteps.length) {
    heading("Your next steps");
    summary.nextSteps.forEach((s, i) => bullet(s.step, s.why, `${i + 1}.`));
  }
  if (summary.deadlines.length) {
    heading("Time-sensitive items");
    summary.deadlines.forEach((d) => bullet(d.item, d.timing));
  }
  if (summary.professionals.length) {
    heading("Who to talk to");
    for (const p of summary.professionals) {
      ensure(40);
      text(p.type, { bold: true, gap: 1 });
      if (p.why) text(p.why, { color: MUTED, size: 10, gap: 4 });
      if (p.questions.length) {
        text("Questions to ask:", { size: 10, bold: true, gap: 2 });
        p.questions.forEach((q) => bullet(q));
      }
      y += 4;
    }
    text(VETTING_NOTE, { size: 9, color: MUTED });
  }
  if (summary.documents.length) {
    heading("Documents and information to gather");
    summary.documents.forEach((d) => bullet(d, undefined, "[ ]"));
  }
  if (summary.completed.length) {
    heading("Already done");
    summary.completed.forEach((c) => bullet(c, undefined, "[x]"));
  }

  // Footer disclaimer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const foot = doc.splitTextToSize(safe(SUMMARY_DISCLAIMER), width) as string[];
    foot.forEach((l, i) => doc.text(l, M, H - 40 + i * 10));
    doc.text(`Page ${p} of ${pages}`, W - M, H - 18, { align: "right" });
  }

  return doc.output("blob");
}
