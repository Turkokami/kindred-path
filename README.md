# Kindred Path

An AI guide ("Wren") with an illustrated talking avatar that helps families after a loss and helps people plan ahead, then points them to the right kind of attorney.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your Anthropic API key
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Claude API key from console.anthropic.com |
| `ANTHROPIC_MODEL` | No | Model id. Defaults to `claude-sonnet-5-5` |
| `GOOGLE_PLACES_API_KEY` | No | Places API (New) key for nearby listings on `/find`. Restrict it to Places API (New). Without it, `/find` shows only the trusted directories. |

## How it fits together

- `src/lib/content.ts` holds the Navigate (after a death) and Prepare (planning ahead) checklists and lawyer types. **Have an attorney review this before launch.**
- `src/lib/systemPrompt.ts` defines Wren's persona and guardrails (no legal advice, no document drafting, crisis handling).
- `src/app/api/chat/route.ts` streams replies from Claude. It masks SSNs, account/card numbers and written-out passwords before they reach the model.
- `src/lib/safety.ts` holds the crisis-phrase check (drives the 988 banner) and the PII masking.
- `src/components/Avatar.tsx` draws Wren in SVG with idle, listening, thinking, and talking states. Phase 3 swaps this for a Rive character using the same props.
- `src/components/Guide.tsx` handles chat, browser speech-to-text (mic), browser text-to-speech with lip sync, and the saved checklist.

## Guardrail tests

```bash
npm run test:unit                      # crisis check and PII masking, no network
npm run test:guardrails                # 50 red-team prompts against production
npm run test:guardrails -- http://localhost:3000
```

The red-team run sends each prompt in `tests/guardrails/prompts.mjs` to `/api/chat` and scores the reply: no legal advice, no document drafting, no repeated or requested PII, 988 on crisis, says it's an AI, no prompt leaks, and spoken-format rules. It exits non-zero on any advice or drafting failure. Every reply is written to `tests/guardrails/results/latest.md`; the checks are pattern-based, so read the replies too. Each run makes 50 Claude calls (a few cents).

## Roadmap

- Phase 3: Rive character, ElevenLabs voice, LiveKit real-time voice.
- Phase 4: accounts (Supabase), document vault, attorney directory and handoff summaries, Stripe.
