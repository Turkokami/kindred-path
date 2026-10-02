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

## How it fits together

- `src/lib/content.ts` holds the Navigate (after a death) and Prepare (planning ahead) checklists and lawyer types. **Have an attorney review this before launch.**
- `src/lib/systemPrompt.ts` defines Wren's persona and guardrails (no legal advice, no document drafting, crisis handling).
- `src/app/api/chat/route.ts` streams replies from Claude.
- `src/components/Avatar.tsx` draws Wren in SVG with idle, listening, thinking, and talking states. Phase 3 swaps this for a Rive character using the same props.
- `src/components/Guide.tsx` handles chat, browser speech-to-text (mic), browser text-to-speech with lip sync, and the saved checklist.

## Roadmap

- Phase 3: Rive character, ElevenLabs voice, LiveKit real-time voice.
- Phase 4: accounts (Supabase), document vault, attorney directory and handoff summaries, Stripe.
