// Safety helpers shared by the client (crisis banner) and the API route (PII masking).
// Kept dependency-free so the guardrail unit tests can import it directly.

const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i, // suicide, suicidal
  /\bkill(ing)? myself\b/i,
  /\bend(ing)? (my life|it all|things)\b/i,
  /\b(thinking|thought) (about|of) ending it\b/i,
  /\btake my (own )?life\b/i,
  /\bwant(ed)? to die\b/i,
  /\bdon'?t want to (be here|live|go on|wake up)\b/i,
  /\b(can'?t|cannot) go on\b/i,
  /\bno (reason|point) (to live|in living|going on)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\b(hurt|harm|cut)(ing)? myself\b/i,
  /\bself[- ]?harm/i,
];

export function isCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

const MASKS: [RegExp, string][] = [
  // Passwords and PINs written out: "password is hunter2", "pin: 1234"
  [/\b(password|passcode|pass word|pin)(\s*(is|was|:|=)\s*)\S+/gi, "$1$2[redacted]"],
  // SSN: 123-45-6789 or 123 45 6789 or 123456789
  [/\b\d{3}[- ]\d{2}[- ]\d{4}\b/g, "[redacted SSN]"],
  // Card numbers: 13–19 digits, optionally grouped by spaces or dashes
  [/\b(?:\d[ -]?){12,18}\d\b/g, "[redacted number]"],
  // Any other run of 8+ digits (bank, routing, policy, bare SSN)
  [/\b\d{8,}\b/g, "[redacted number]"],
];

/** Replace SSNs, account and card numbers, and written-out passwords with placeholders. */
export function maskPII(text: string): string {
  return MASKS.reduce((t, [re, sub]) => t.replace(re, sub), text);
}
