// The optional 30-second intake. Every answer is picked from a fixed list, so the profile can't
// carry free text (no PII, no prompt injection). The server re-validates with sanitizeProfile().

import type { Mode } from "./content";

export type Profile = Record<string, string>;
type Field = { id: string; label: string; options: [value: string, label: string][] };

export const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const YNU: [string, string][] = [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]];
const YN: [string, string][] = [["yes", "Yes"], ["no", "No"]];

export const PROFILE_FIELDS: Record<Mode, Field[]> = {
  navigate: [
    { id: "state", label: "Which state did they live in?", options: US_STATES },
    {
      id: "relationship",
      label: "Who passed away?",
      options: [["parent", "My parent"], ["spouse", "My spouse or partner"], ["child", "My child"], ["sibling", "My sibling"], ["other", "Someone else"]],
    },
    {
      id: "when",
      label: "When did it happen?",
      options: [["days", "In the last few days"], ["weeks", "In the last few weeks"], ["months", "A few months ago"], ["longer", "Longer ago"]],
    },
    { id: "will", label: "Did they leave a will or trust?", options: YNU },
    { id: "home", label: "Did they own a home?", options: YNU },
    { id: "executor", label: "Are you the executor?", options: [["yes", "Yes"], ["no", "No, someone else is"], ["unsure", "Not sure yet"]] },
  ],
  prepare: [
    { id: "state", label: "Which state do you live in?", options: US_STATES },
    { id: "partner", label: "Are you married or in a long-term partnership?", options: YN },
    { id: "minors", label: "Do you have children under 18?", options: YN },
    { id: "home", label: "Do you own a home?", options: YN },
    { id: "business", label: "Do you own a business?", options: YN },
    {
      id: "docs",
      label: "What do you already have?",
      options: [["none", "Nothing yet"], ["will", "A will"], ["trust", "A trust"], ["both", "A will and a trust"], ["unsure", "Not sure"]],
    },
    { id: "special", label: "Does anyone rely on you who has special needs or disability benefits?", options: YN },
  ],
};

/** Keep only known fields with allowed values. */
export function sanitizeProfile(raw: unknown, mode: Mode): Profile {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Profile = {};
  for (const f of PROFILE_FIELDS[mode]) {
    const v = r[f.id];
    if (typeof v === "string" && f.options.some(([val]) => val === v)) out[f.id] = v;
  }
  return out;
}

/** Plain-language lines for prompts and the summary, e.g. "Which state did they live in? Texas". */
export function profileLines(profile: Profile, mode: Mode): string[] {
  return PROFILE_FIELDS[mode]
    .filter((f) => profile[f.id])
    .map((f) => `${f.label} ${f.options.find(([v]) => v === profile[f.id])![1]}`);
}

export function stateName(profile: Profile): string | undefined {
  return US_STATES.find(([code]) => code === profile.state)?.[1];
}
