# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service **Next.js 15 (App Router) + React 19 + TypeScript** client-side web app ("Simple Excel Conversion"). It converts Legal Shield Excel exports into the column keys required by FieldNote.Ai, entirely in the browser (no backend/API, no database). Package manager is **npm** (`package-lock.json`).

### Running / testing / building
Standard scripts in `package.json`:
- Dev server: `npm run dev` (Next.js + Turbopack, serves on `http://localhost:3000`).
- Lint: `npm run lint` (uses `next lint`; note it prints a deprecation warning but works).
- Production build: `npm run build`.

There is no automated test suite in this repo; verify changes manually in the browser.

### Non-obvious gotchas
- The app is gated by a hardcoded password screen. Test credentials live in `app/keys.tsx` (`shittyDb.users`). Use password `bbyb1873` (user `billButkovich`) to log in. There is no real auth/secret backend — no secrets are required to run or test this app.
- `app/layout.tsx` loads Geist fonts via `next/font/google`, so `npm run build` and first dev render fetch from Google Fonts and need outbound network access.
- To exercise the core convert flow you need a Legal Shield-style `.xlsx`. The uploaded sheet's first sheet is read with headers like `First Name`, `Last Name`, `Email`, `Member Number`, `Plan Description`, `Monthly Premium`, `Cell Phone`, address fields, etc. Converting normally also needs a second "Field Note" sheet — to skip that, check the **New Group** checkbox after uploading the main file. The **Convert** button stays disabled until `Group #` and `Company` are filled (and either a Field Note file is loaded or New Group is checked). **Download** writes `simpleExcelConvertDownload.xlsx`.
