# Changelog

## Unreleased

### Added
- Guardrail red-team suite (`tests/guardrails`): 50 scripted prompts across legal advice, document drafting, PII, crisis, jailbreaks, and "are you human?". `npm run test:guardrails`. First run against production: 50/50 pass, zero advice or drafting failures.
- Unit tests for the crisis check and PII masking (`npm run test:unit`).
- Server-side masking of SSNs, account/card/routing numbers and written-out passwords before messages reach the model (guardrail 4).

### Fixed
- Crisis banner never fired for "suicide" or "suicidal": the old pattern ended in `suicid\b`, which can't match inside a longer word. It also missed phrases like "ending it", "better off without me" and "can't go on". Moved to `src/lib/safety.ts` with a wider phrase list and tests.

## 2026-10-02

### Fixed
- Unpacked the app source from `Kindred-Path-MASTER.zip` into the repo root. Before this, `main` held only zip files, so Vercel had no `package.json` or `src/` to build.
- Vercel Framework Preset changed from "Other" to "Next.js" (dashboard setting). With "Other", builds succeeded but every page returned 404.

### Verified
- Live at https://kindred-path-five.vercel.app. Pages load, Claude replies stream, and the will-template, trust-advice, crisis and "are you a real person?" checks pass.
