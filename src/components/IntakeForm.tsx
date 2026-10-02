"use client";

import type { Mode } from "@/lib/content";
import { PROFILE_FIELDS, type Profile } from "@/lib/profile";

/** The optional intake shown before the conversation starts. Every answer is optional. */
export default function IntakeForm({
  mode,
  profile,
  onChange,
}: {
  mode: Mode;
  profile: Profile;
  onChange: (p: Profile) => void;
}) {
  return (
    <fieldset className="w-full max-w-xl rounded-2xl border border-line bg-bg p-4 text-left">
      <legend className="px-1 text-sm font-semibold text-ink">A few quick questions (optional)</legend>
      <p className="text-xs text-muted">
        This helps Wren start in the right place. Skip any you&apos;d rather not answer. Your answers stay on this device
        and are only used to guide the conversation.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PROFILE_FIELDS[mode].map((f) => (
          <label key={f.id} className="text-sm text-muted">
            {f.label}
            <select
              value={profile[f.id] ?? ""}
              onChange={(e) => {
                const next = { ...profile };
                if (e.target.value) next[f.id] = e.target.value;
                else delete next[f.id];
                onChange(next);
              }}
              className="mt-1 w-full rounded-xl border border-line bg-card px-2.5 py-2 text-ink"
            >
              <option value="">Skip</option>
              {f.options.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
