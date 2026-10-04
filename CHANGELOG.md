# Changelog

## Unreleased

### Added
- Interim "living portrait" for Wren (`src/lib/wrenWarp.ts`): a WebGL warp of the single illustration adds a gentle body sway, head tilt (head and resting hand together), small nods while talking, an attentive tilt while listening, breathing, and hair sway. Mouth and blink frames are composited first so they move with her. Respects reduced motion, pauses off-screen, and falls back to the static picture without WebGL. `?wrenDebug` exposes `window.__wren.debugDraw(t, gain)` for tuning. To be replaced by a Rive or Live2D rig.
- Pre-launch basics: abuse protection on every paid API route (`src/lib/guard.ts`: same-origin check, Vercel BotID, per-visitor rate limits; test-script bypass via `GUARDRAIL_TEST_KEY`), draft privacy policy and terms marked for attorney review (`/privacy`, `/terms`, linked site-wide), `robots.txt` + `sitemap.xml` (search engines blocked until `NEXT_PUBLIC_ALLOW_INDEXING=true`), a share-preview image, and Vercel Web Analytics. Site description no longer says Kindred Path "connects" people with attorneys.
- "Money and benefits you may be owed" page (`/benefits`): free official searches (SSA survivor benefits, NAIC life insurance locator, MissingMoney, VA burial benefits, PBGC pensions, Treasury Hunt) plus an employer checklist and a warning about paid "finders". Linked under the after-a-loss checklist; Wren may mention it.
- Optional 30-second intake before the conversation (state, relationship, timing, will, home, executor; or for planning: state, partner, kids, home, business, existing documents, special needs). Multiple choice only, saved on the device (`kp-profile-<mode>`), re-validated on the server, and used by Wren and the summary. Unit tests cover the validation.
- "Get my summary (PDF)": after a conversation, Wren builds a personal summary (situation, ordered next steps, deadlines, who to talk to with questions to ask, documents to gather, steps done) via `/api/summary` (forced tool call, PII masked, nothing stored). The person reviews and edits it, then downloads a PDF generated in their browser (jsPDF). Optional email delivery via Resend (`/api/summary/email`) stays off until `RESEND_API_KEY` and `SUMMARY_EMAIL_FROM` are set. Wren offers the summary once at a natural stopping point.
- Voice menu in the chat header: Jessica (default), Jane, Clara, or Voice off. Switching plays a short sample; the choice is remembered on that device. The server only accepts voices listed in `src/lib/voices.ts`.
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
