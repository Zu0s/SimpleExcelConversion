# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service **Next.js 15 (App Router) + React 19 + TypeScript** app. It converts Legal Shield Excel exports to FieldNote.Ai column keys in the browser. There is no backend. Package manager is **npm** (`package-lock.json`).

### Running / lint / build

- Dev server: `npm run dev` (http://localhost:3000)
- Lint: `npm run lint`
- Production build: `npm run build`

There is no automated test suite. Verify changes in the browser.

### Non-obvious notes

- The app is gated by a local password screen. Test users live in `app/keys.tsx`. Do not copy credentials into this file, `.cursor/environment.json`, logs, or chat.
- `app/layout.tsx` loads Geist via `next/font/google`, so the first `next dev` / `next build` needs outbound network access to Google Fonts.
- Convert flow: upload a Legal Shield-style `.xlsx`. Check **New Group** to skip a Field Note file. **Convert** stays disabled until `Group #` and `Company` are filled. **Download** writes `simpleExcelConvertDownload.xlsx`.

### Intended Cloud Agent environment

`.cursor/environment.json` installs with `npm ci` and starts `npm run dev` on each boot. Use this environment for Chancellor, Operative, Supply Fixer, Sniper (Adversarial Code Review), and Bug Powertech. Existing agent conversations cannot be retrofitted; launch a new run of those roles against this environment.
