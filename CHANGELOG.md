# Changelog

## Unreleased

### Added
- ElevenLabs voice for Wren (`/api/tts`, `src/lib/wrenVoice.ts`). Each sentence is sent to ElevenLabs as soon as it streams in and played in order, so the next clip is ready before the current one ends. The mouth follows ElevenLabs' per-character timings (open on vowels, closed on M/B/P) instead of random flapping. Audio is unlocked by the "Start talking" tap for iPhone. Falls back to the browser voice per sentence if ElevenLabs fails, and for the whole visit if it isn't configured or is out of credits.
- "Find a professional" page (`/find`): nearby attorneys, CPAs, funeral homes, cremation and grief support via Google Places (`GOOGLE_PLACES_API_KEY`), under a large non-dismissable "please fully vet anyone" notice, plus free trusted directories (state bar referral, NAELA, CPAverify, Funeral Consumers Alliance, FTC Funeral Rule). Listings are labeled as listings, not recommendations; nobody pays to appear. Without the key, the page shows only the directories.
- Wren never names or ranks a specific business; she can point people to the Find a professional page (in navigate mode, only when asked). Two new red-team prompts cover this (52 total).
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
