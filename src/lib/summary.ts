// Shape of the personalized summary Wren builds at the end of a conversation.
// Shared by /api/summary (which asks Claude to fill it) and the summary panel / PDF.

export type Summary = {
  title: string;
  situation: string[];
  nextSteps: { step: string; why: string }[];
  completed: string[];
  professionals: { type: string; why: string; questions: string[] }[];
  deadlines: { item: string; timing: string }[];
  documents: string[];
  crisis: boolean;
};

export const SUMMARY_DISCLAIMER =
  "This is a personal checklist made by Kindred Path's AI guide from your conversation. It is general information, not legal, tax, or financial advice, and it is not a legal document. Laws and deadlines vary by state, so confirm everything with a licensed professional before you act.";

export const VETTING_NOTE =
  "Kindred Path does not recommend specific providers. Check any professional's license and fees before you hire them.";

/** JSON schema handed to Claude as a forced tool call, so the reply always has this shape. */
export const SUMMARY_TOOL = {
  name: "save_summary",
  description: "Save the person's personalized summary.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short title, e.g. 'Your next steps after losing your dad' or 'Your planning checklist'." },
      situation: {
        type: "array",
        items: { type: "string" },
        description: "3-6 short facts the person shared (state, family, what exists so far). Never include SSNs, account numbers, or passwords. Empty if they shared little.",
      },
      nextSteps: {
        type: "array",
        items: {
          type: "object",
          properties: { step: { type: "string" }, why: { type: "string", description: "One plain sentence." } },
          required: ["step", "why"],
        },
        description: "Their remaining steps in order, most urgent first, personalized to what they shared. 4-10 items.",
      },
      completed: { type: "array", items: { type: "string" }, description: "Steps already done (from the checklist or conversation)." },
      professionals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", description: "A type of professional, e.g. 'Probate attorney'. Never a named person or firm." },
            why: { type: "string" },
            questions: { type: "array", items: { type: "string" }, description: "3-5 questions to ask at the first meeting." },
          },
          required: ["type", "why", "questions"],
        },
      },
      deadlines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            item: { type: "string" },
            timing: { type: "string", description: "General timing, e.g. 'Usually within 9 months of the death'. Add 'confirm for your state' where rules vary." },
          },
          required: ["item", "timing"],
        },
        description: "Time-sensitive items relevant to them. Empty if none apply.",
      },
      documents: { type: "array", items: { type: "string" }, description: "Documents and information to gather." },
      crisis: { type: "boolean", description: "True if the person expressed thoughts of suicide, self-harm, or being in crisis." },
    },
    required: ["title", "situation", "nextSteps", "completed", "professionals", "deadlines", "documents", "crisis"],
  },
};

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strs = (v: unknown, n = 12) => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean).slice(0, n) : []);

/** Defensive copy of whatever the model returned, so the UI and PDF never see a malformed shape. */
export function cleanSummary(raw: unknown): Summary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const objs = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]).filter((x) => x && typeof x === "object") : []);
  return {
    title: str(r.title, 120) || "Your next steps",
    situation: strs(r.situation, 8),
    nextSteps: objs(r.nextSteps)
      .map((s) => ({ step: str(s.step, 200), why: str(s.why, 300) }))
      .filter((s) => s.step)
      .slice(0, 12),
    completed: strs(r.completed, 20),
    professionals: objs(r.professionals)
      .map((p) => ({ type: str(p.type, 80), why: str(p.why, 300), questions: strs(p.questions, 6) }))
      .filter((p) => p.type)
      .slice(0, 4),
    deadlines: objs(r.deadlines)
      .map((d) => ({ item: str(d.item, 200), timing: str(d.timing, 200) }))
      .filter((d) => d.item)
      .slice(0, 8),
    documents: strs(r.documents, 15),
    crisis: r.crisis === true,
  };
}
