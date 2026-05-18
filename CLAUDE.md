# CA Inter G2 Companion site

Astro 4 + TypeScript. Static viewer for the user's CA Inter Group 2 study planner Google Sheet.

## URLs
- **Live (GitHub Pages)**: https://spacechase26.github.io/ca-inter/
- **Dev server (this VPS)**: http://138.124.50.18:4323 — run `npm run dev`
- **Repo**: git@github.com:spacechase26/ca-inter.git

## Stack
- Astro 4 static output (no SSR)
- TypeScript (strict)
- `papaparse` for CSV decoding
- `pdfjs-dist` for inline PDF rendering (chapter pages only)
- Plain CSS with custom-property tokens. No Tailwind. No React.

## Data flow
- Source: user's Google Sheet, published as CSV per tab (no auth, public read)
- `src/lib/sheets.ts` hardcodes the published sheet ID + tab GID map
- Browser fetches CSVs client-side on page load; cached in `localStorage` 5 min
- Cross-device PDF resume: tiny Google Apps Script web app writes to a hidden `ReadingState` tab in the same Sheet (deployed once from the user's Google account; URL in `src/lib/sync.ts`)

## Build / deploy
- `npm run dev` — dev server on 4323 (hot-reload)
- `npm run build` — produces `dist/`
- `npm run preview` — serves built site on 4324
- Push to `main` → GitHub Actions runs `withastro/action@v3` → `actions/deploy-pages@v4` publishes
- `astro.config.mjs` has `base: '/ca-inter'` — all internal links use `import.meta.env.BASE_URL`

## Working style
- Edit one file per change. Don't touch markup if a content file will do.
- Tell the user to refresh **http://138.124.50.18:4323** to see changes.
- Sheet edits take 5–15 min to propagate to the published CSV (Google's cache).
- Click "Refresh data" in the site header to force-bust the localStorage cache.
- No `Co-Authored-By:` lines in commits (per user preference).
- Use `harendra12912@gmail.com` for commit author email.

## File map
- `src/pages/*.astro` — one per route
- `src/lib/sheets.ts` — CSV URLs + tab GID map (only file to edit if Sheet structure changes)
- `src/lib/sync.ts` — Apps Script URL (set once after deploying `apps-script/Code.gs`)
- `src/components/PdfViewer.astro` — PDF.js renderer with cross-device resume
- `public/pdfs/` — drop study PDFs here; URL becomes `/ca-inter/pdfs/<name>.pdf`
- `apps-script/Code.gs` — server-side sync; deploy via Sheet → Extensions → Apps Script
