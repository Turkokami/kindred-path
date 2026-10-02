# Changelog

## Unreleased

### Fixed
- Unpacked the app source from `Kindred-Path-MASTER.zip` into the repo root. Before this, `main` held only zip files, so Vercel had no `package.json` or `src/` to build.

### Verified
- `npm run build` and `npm run lint` pass locally (Next.js 15.5.27).
- `/`, `/guide?mode=navigate`, `/guide?mode=prepare` return 200 from `next start`.
- `/api/chat` returns the "not connected" message when `ANTHROPIC_API_KEY` is unset.
