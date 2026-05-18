# CA Inter G2 Companion site

Astro 4 + TypeScript. Static viewer for the user's CA Inter Group 2 study planner Google Sheet, with a built-in PDF library.

## URLs
- **Live (GitHub Pages)**: https://spacechase26.github.io/ca-inter/
- **Dev server (this VPS)**: http://138.124.50.18:4323 — run `npm run dev`
- **Repo**: git@github.com:spacechase26/ca-inter.git

## Stack
- Astro 4 static output (no SSR)
- TypeScript (strict)
- `papaparse` for CSV decoding
- `pdfjs-dist` for inline PDF rendering (`/library/[slug]`, chapter pages)
- Plain CSS with custom-property tokens. No Tailwind. No React.

## Data flow
- Source: user's Google Sheet, published as CSV per tab (no auth, public read)
- `src/lib/sheets.ts` hardcodes the published sheet ID + 11-tab GID map (tab `pdfs` = `665233018`)
- Browser fetches CSVs client-side; cached in `localStorage` 5 min
- Bundled JSON snapshots in `src/data/snapshots/` are the offline fallback + the source for build-time `getStaticPaths`
- Cross-device PDF resume: tiny Google Apps Script web app writes a hidden `ReadingState` tab in the same Sheet (URL in `src/lib/sync.ts`)

## PDFs — how the library works (read before touching anything PDF)
- **Source of truth**: the Sheet's `11 · PDFs` tab. Columns: `Category | Paper | Ch# | Title | Path | Pages | Notes`.
- **`Path` is relative to `public/pdfs/`**, no leading slash, no `pdfs/` prefix. e.g. `icai/rtp/p4-may2026.pdf`. `resolvePdf` in `src/lib/pdf.ts` auto-prepends `pdfs/`.
- **In production, PDFs are served via jsdelivr**, NOT GitHub Pages. `resolvePdf` rewrites to `https://cdn.jsdelivr.net/gh/spacechase26/ca-inter@main/public/<path>` when `import.meta.env.PROD`. Reason: GH Pages India routing was ~40× slower (43 s vs 1 s for 700 KB) — see commit `08e069f`. Dev still uses the local origin.
- **`scripts/strip-dist-pdfs.mjs`** runs as a `postbuild` hook and deletes `dist/pdfs/` so the GH Pages artifact is ~4 MB instead of 140 MB.
- **`pdf.worker.min.mjs` is self-hosted** in `public/`. `scripts/sync-pdf-worker.mjs` copies it from `node_modules/pdfjs-dist/build/` on every `predev`/`prebuild`. Worker version must exactly match the installed `pdfjs-dist` API — never hardcode a CDN URL.
- **PDF.js options**: `disableRange: true` + `disableStream: false` = single GET with incremental parse. Removing `disableRange: true` silently breaks the progress bar.
- **First-paint flow**: `state.pdf = await loadPdf()` → render page 1 immediately using `getLastPageLocal()` (sync localStorage read) → only THEN call `getLastPage()` to reconcile with remote (skipped if local was written in last 30 s via `isLocalFresh`).
- **Paper matching**: Sheet rows with `Paper="P6"` match BOTH P6A and P6B chapters (Group-II RTPs/QPs combine FM + SM). See `pdfsForChapter` in `src/lib/pdf.ts`. The `/library` filter chips suppress the "P6" chip — users think in P6A/P6B.
- **Blank `Ch#` = paper-wide**: applies to every chapter of that paper. Both `Paper` and `Ch#` blank = applies to every paper.
- **Build-time routes**: `src/pages/library/[slug].astro` builds one viewer page per unique PDF Path. Dedupe prefers the most general row (blank Paper + blank Ch# wins) so the eyebrow doesn't lie.

## Build / deploy
- `npm run dev` — `predev` syncs worker, then Astro dev on 4323 (hot-reload)
- `npm run build` — `prebuild` syncs worker, Astro builds, `postbuild` strips `dist/pdfs/`
- `npm run preview` — serves built site on 4324
- Push to `main` → GitHub Actions runs `withastro/action@v3` → `actions/deploy-pages@v4` publishes
- `astro.config.mjs` has `base: '/ca-inter'` — all internal links use `import.meta.env.BASE_URL`

## Working style
- Edit one file per change. Don't touch markup if a content file will do.
- Tell the user to refresh **http://138.124.50.18:4323** to see changes.
- Sheet edits take 5–15 min to propagate to the published CSV (Google's cache).
- New PDFs: ~5–10 min for jsdelivr's edge to fetch from GitHub after `git push`. The viewer error message is already user-friendly when this happens.
- Click "Refresh data" in the site header to force-bust the localStorage cache for Sheet data.
- No `Co-Authored-By:` lines in commits (per user preference).
- Use `harendra12912@gmail.com` for commit author email.

## File map
- `src/pages/*.astro` — one per route. `library/[slug].astro` + `library/index.astro` are the PDF library; `syllabus/[chapter].astro` lists per-chapter PDFs.
- `src/lib/sheets.ts` — **THE main config file.** Holds `SHEET_PUBLISHED_ID` and 11-entry `TAB_GIDS`.
- `src/lib/pdf.ts` — `resolvePdf` (jsdelivr in prod, local in dev), `pdfSlug`, `pdfsForChapter`, `groupByCategory`, `categoryKey`.
- `src/lib/sync.ts` — Apps Script URL + `getLastPage` / `getLastPageLocal` / `isLocalFresh` / `setLastPage`.
- `src/components/PdfViewer.astro` — canvas renderer + worker + fullscreen + JS-blob download (cross-origin `<a download>` is silently ignored, so we fetch ourselves).
- `src/components/PdfCard.astro` — clickable library card; preloads its PDF on hover (`<link rel="prefetch">`).
- `scripts/icai_inventory.py` — single source of truth for the 87 ICAI PDFs (URL → local path map).
- `scripts/fetch-icai-pdfs.py` — idempotent downloader.
- `scripts/seed-pdfs-tab.py` — emits CSV for the Sheet `11 · PDFs` tab + the JSON snapshot.
- `scripts/sync-pdf-worker.mjs` — copies pdfjs worker into `public/` (predev/prebuild hook).
- `scripts/strip-dist-pdfs.mjs` — removes `dist/pdfs/` from the GH Pages artifact (postbuild hook).
- `public/pdfs/` — 87 ICAI PDFs in subfolders. Lives in git for jsdelivr to mirror.
- `apps-script/Code.gs` — server-side sync; deploy via Sheet → Extensions → Apps Script.
