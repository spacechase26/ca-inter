# CA Inter G2 Companion — Architecture & Decisions

A handoff doc. Read this first if you're a future-you, a teammate, or an AI assistant being asked to extend this project.

---

## 1. What this is

A static website at https://spacechase26.github.io/ca-inter/ that serves as a pretty, read-only mirror of a CA Inter Group 2 study planner. The single source of truth for all data is a Google Sheet. The site re-fetches data on every load (with a 5-min localStorage cache), so editing the Sheet from any device updates the website automatically.

PDFs (87 ICAI study-material chapters + RTPs + past papers, plus any personal notes/charts the user uploads) render inline via PDF.js. Each PDF has a dedicated `/library/<slug>` viewer route; chapter pages list applicable PDFs grouped by category. The last-page-viewed is synced across devices through a Google Apps Script web app that writes to a hidden tab in the same Sheet. PDFs themselves are served from jsdelivr's multi-CDN (not GH Pages — see §5 "Why jsdelivr").

**Live URL**: https://spacechase26.github.io/ca-inter/
**Repo**: https://github.com/spacechase26/ca-inter
**Working dir on VPS**: `/home/coder/ca-inter`
**Dev server**: `http://138.124.50.18:4323/ca-inter` (run `npm run dev`)

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 4 | Static output, multi-page, TypeScript, same as `/var/www/art-journey` |
| Language | TypeScript (strict) | Type safety on Sheet shapes |
| Styling | Plain CSS + custom-property tokens | No Tailwind. Matches `art-journey` conventions. |
| CSV parsing | `papaparse` | Handles quoted multiline cells, leading empty columns |
| PDF rendering | `pdfjs-dist` (Mozilla PDF.js) | Inline canvas render works on iOS Safari (iframes don't). Worker self-hosted in `public/`. `disableRange:true` + `disableStream:false` = single GET with incremental parse — tuned for our 1–10 MB files. |
| PDF hosting | jsdelivr (`cdn.jsdelivr.net/gh/...`) | Multi-CDN (Cloudflare + Fastly + StackPath); 40× faster than GH Pages for the user's India route. Mirrors any public GitHub repo. PDFs themselves stay in the repo at `public/pdfs/`. |
| Hosting | GitHub Pages | Free, CDN, auto-deploys on push to `main`. Pages ships only the Astro build (`dist/`); `dist/pdfs/` is stripped by `postbuild` so the artifact is ~4 MB instead of 140 MB. |
| CI/CD | `.github/workflows/deploy.yml` | `withastro/action@v3` + `actions/deploy-pages@v4` |
| Data store | Google Sheets (the planner xlsx imported) | Cross-device editing for free. No DB. |
| Write sync | Google Apps Script web app | Writes PDF-resume state to a hidden `ReadingState` tab |

---

## 3. Data flow

```
┌──────────────────────────┐
│ User edits in            │
│ Google Sheets mobile app │
└──────────┬───────────────┘
           │ (5–15 min for Google to refresh published CSV)
           ▼
┌──────────────────────────────────────────────────────────────┐
│ Published Sheet CSV endpoints                                │
│ https://docs.google.com/spreadsheets/d/e/<PUBLISHED_ID>/pub  │
│   ?gid=<TAB_GID>&single=true&output=csv                      │
└──────────┬───────────────────────────────────────────────────┘
           │ fetch (client-side, browser)
           ▼
┌──────────────────────────────────────────────┐
│ src/lib/sheets.ts  →  getSheet(tabKey)       │
│   1. Try 5-min localStorage cache            │
│   2. Else fetch CSV                          │
│   3. Else fall back to bundled JSON snapshot │
└──────────┬───────────────────────────────────┘
           │ papaparse + type coercion + date normalization
           ▼
┌──────────────────────────┐
│ Astro page renders       │
│ (e.g. /syllabus, /today) │
└──────────────────────────┘

Cross-device PDF resume (separate flow):
┌─────────────┐  GET ?key=<pdf>     ┌─────────────────────────┐
│ PdfViewer   │ ─────────────────▶ │ Apps Script /exec       │
│ component   │ ◀───────────────── │ doGet → ReadingState tab │
│             │  {"page": N}        │                         │
│             │                     │                         │
│ on page chg │  POST {key, page}   │                         │
│             │ ─────────────────▶ │ doPost → upsert row     │
└─────────────┘                     └─────────────────────────┘
       │
       │ also writes localStorage `pdf:lastPage:<key>`
       │ (offline fallback + fast cache)
       ▼
   localStorage
```

---

## 4. File-by-file map

### Root
- `astro.config.mjs` — Astro config. `base: '/ca-inter'`, `output: 'static'`. Dev server on port 4323.
- `package.json` — deps: `astro`, `papaparse`, `pdfjs-dist`, `@types/papaparse`.
- `tsconfig.json` — extends `astro/tsconfigs/strict`. Path alias `@/*` → `src/*`.
- `.gitignore` — node_modules, dist, .astro, .env*.
- `.github/workflows/deploy.yml` — CI/CD. Runs on push to `main`.
- `CLAUDE.md` — AI-readable project instructions (dev workflow, conventions).
- `README.md` — user-facing setup guide.

### `src/lib/` — data layer
- `sheets.ts` — **THE main config file.** Holds `SHEET_PUBLISHED_ID` and 11-entry `TAB_GIDS` (10 planner tabs + `pdfs`). Exposes `getSheet(tab)` (live + cache + fallback) and `getSnapshot(tab)` (synchronous, for `getStaticPaths` at build time).
- `parse.ts` — `parseSheetCsv(csv)`: papaparse + strip 4-row title block + leading empty column. `coerce(raw)`: type-coerces cells (`"5"` → 5, `"TRUE"` → true, `"Mon 18 May"` → `"2026-05-18"`, `"10%"` → 0.1).
- `cache.ts` — `cacheGet/cacheSet/cacheClear` for `localStorage` with TTL. Used only for CSV caching (not for PDF page state).
- `slug.ts` — `slugify(name)` and `chapterSlug(paper, ch, name)` for URL paths.
- `today.ts` — `todayIso()`, `isoToDate()`, `daysBetween()`, `formatPretty()` for date logic. All ISO-based.
- `pdf.ts` — `resolvePdf(path)` returns the jsdelivr URL in prod, local origin in dev. `pdfSlug` / `pdfKey` derive URL-safe identifiers. `pdfsForChapter` filters PDFs to ones applicable to a chapter (incl. the P6 → P6A/P6B alias). `groupByCategory` + `categoryKey` drive the per-category sections.
- `sync.ts` — `APPS_SCRIPT_URL` + `getLastPage` (remote, async) / `getLastPageLocal` (local, sync) / `isLocalFresh` (skip remote if local <30 s old) / `setLastPage` (writes localStorage immediately + Apps Script debounced 1500 ms).

### `src/data/snapshots/*.json` — fallback bundled data
Generated by `scripts/generate-snapshots.py` from the local `/home/coder/CA_INTER_G2_Planner_v1.xlsx`. Used when:
- `SHEET_PUBLISHED_ID` is empty (zero-config dev), or
- The live CSV fetch fails (offline, 404, etc.).

11 JSON files, one per tab (added `pdfs.json` in Phase 11). All have shape `{headers: string[], rows: object[]}` except `wellness.json` which has `{sections: [{title, items}]}` (handled specially in `pages/wellness.astro`).

**Re-generate** by editing the local xlsx and running:
```sh
cd /home/coder/ca-inter
PYTHONPATH=/home/coder/.python_libs python3 scripts/generate-snapshots.py
```

### `src/types/sheet.ts`
TypeScript interfaces for every tab: `Chapter`, `DailyRow`, `Mock`, `Phase`, `KeyDate`, `Resource`, `NoteRow`, `WellnessRow`, `PdfRecord`. Plus `SheetData<T>` (generic snapshot shape) and `TabKey` (union of all tab keys, includes `pdfs`).

### `src/styles/`
- `tokens.css` — palette (cream/ink), per-paper accent colors (P4=blue, P5=amber, P6A=emerald, P6B=pink), spacing scale, type scale, motion easing.
- `base.css` — reset, body styles, common utility classes (`.chip`, `.card`, `.eyebrow`, `.meta`, `.sr-only`). Imports tokens.

### `src/layouts/Base.astro`
Wraps every page. Renders top nav (incl. `/library`), page header (eyebrow + title + description), `<slot />`, footer. Includes Google Fonts (trimmed to actually-used weights: Fraunces 500, Inter 400/500/700, Mono 400/500) + RefreshButton. Preconnect hints for `cdn.jsdelivr.net`, `script.google.com`, `script.googleusercontent.com` so PDF viewer + Apps Script calls don't pay a fresh TLS handshake. Mobile-responsive (nav wraps below 640px).

### `src/components/`
- `RefreshButton.astro` — clears `ca-inter:cache:*` keys from localStorage, reloads page.
- `KpiCard.astro` — dashboard stat card with label, value, optional suffix, hint.
- `ChapterCard.astro` — syllabus grid tile. Paper-colored accent bar, priority chip, hours/weight/dates.
- `DailyRow.astro` — daily plan row with phase accent, practical/theory/revisit blocks, plan/actual/confidence metrics.
- `PdfCard.astro` — clickable library/chapter card. Category accent stripe. Prefetches its PDF on `pointerenter` so the viewer page has the bytes ready by the time it mounts.
- `PdfViewer.astro` — PDF.js canvas renderer. Toolbar: page nav + zoom + fullscreen + JS-blob download (cross-origin `<a download>` is silently ignored — we grab bytes ourselves). Wires to `sync.ts` for cross-device resume; renders page 1 from localStorage first, reconciles with Apps Script in the background (skipped if local <30 s old). Progress bar shows MB loaded / MB total during PDF.js's single GET.

### `src/pages/`
| Route | File | Source tabs |
|---|---|---|
| `/` | `index.astro` | dashboard + daily + syllabus + phases + mocks |
| `/today` | `today.astro` | daily |
| `/daily` | `daily.astro` | daily (all 236 rows, phase filter, jump-to-today) |
| `/syllabus` | `syllabus/index.astro` | syllabus (45 cards grouped by paper) |
| `/syllabus/<slug>` | `syllabus/[chapter].astro` | syllabus + pdfs (chapter detail; lists matching PDFs grouped by Category) |
| `/library` | `library/index.astro` | pdfs (all PDFs grouped by Category, paper-filter chips) |
| `/library/<slug>` | `library/[slug].astro` | pdfs (dynamic — one viewer page per unique Path; dedupe prefers paper-wide rows) |
| `/mocks` | `mocks.astro` | mocks |
| `/phases` | `phases.astro` | phases |
| `/resources` | `resources.astro` | resources |
| `/wellness` | `wellness.astro` | wellness (custom shape) |
| `/notes` | `notes.astro` | notes |

### `apps-script/Code.gs`
Server-side script deployed in the user's Google account (NOT part of the Astro build). Exposes `doGet` (read state) and `doPost` (write state) on a hidden `ReadingState` tab in the same Sheet. Auto-creates the tab on first call.

### `scripts/`
- `generate-snapshots.py` — `openpyxl`-based xlsx → JSON for the 10 planner tabs. Handles 4-row title block, HYPERLINK formulas, wellness sections, ISO dates. Requires `openpyxl` in `/home/coder/.python_libs/` (no `pip`, no `sudo` on this VPS).
- `icai_inventory.py` — single source of truth for the 87 ICAI PDFs. NamedTuple per PDF: `(category, paper, chapter, title, url, local_path, notes)`. Lists: `P4_STUDY` / `P5_STUDY` / `P6A_STUDY` / `P6B_STUDY` / `RTPS` / `QPS`. Add new URLs here when ICAI publishes a new edition.
- `fetch-icai-pdfs.py` — idempotent downloader. 3 retries × 5 s backoff, atomic `.part` rename, `--force` and `--only=P5` flags.
- `seed-pdfs-tab.py` — emits `scripts/pdfs-seed.csv` (for one-time Sheet `11 · PDFs` import) AND `src/data/snapshots/pdfs.json` (build-time fallback).
- `sync-pdf-worker.mjs` — `predev`/`prebuild` hook. Copies `pdf.worker.min.mjs` from `node_modules/pdfjs-dist/build/` into `public/`. Locks the worker version to the installed API version.
- `strip-dist-pdfs.mjs` — `postbuild` hook. Deletes `dist/pdfs/` so the GH Pages artifact stays small (~4 MB vs 140 MB).

### `public/`
- `favicon.svg` — two-page book SVG, P4-blue + P5-amber.
- `pdf.worker.min.mjs` — synced from node_modules at build time; served same-origin so the worker has matching version and no cross-origin module-worker quirks.
- `pdfs/icai/{study-material,rtp,qp}/...` — 87 ICAI PDFs (~135 MB). Lives in git so jsdelivr can mirror; stripped from the Astro `dist/` build via postbuild hook.
- `pdfs/{mtp,external,scanners,notes,charts}/` — user-managed categories, drop-files-here.

---

## 5. Key decisions worth remembering

### Why a snapshot fallback?
Three reasons:
1. **Zero-config dev**: clone the repo, `npm install`, `npm run dev` → working site with real data. No need to publish a Sheet first.
2. **Offline / network failure**: if the user's phone is offline or Google's CDN hiccups, the site still renders something.
3. **Initial load speed**: build-time pages (chapter detail routes via `getStaticPaths`) can pre-render with real data.

### Why ISO dates everywhere internally?
Google Sheets CSVs serialize dates in display format (`Mon 18 May`, locale-dependent, often no year). The site's `r.Date >= today` comparison needs ISO strings. `parse.ts/coerce()` detects display-format dates and normalizes to ISO, using May-Dec → 2026 / Jan-Apr → 2027 year inference for this specific planner's calendar.

### Why Apps Script for cross-device PDF resume, not localStorage?
localStorage is per-device. The Apps Script writes to a hidden tab in the SAME Sheet, so the Sheet stays the single source of truth for ALL state (both daily-plan data the user edits in the app, AND PDF reading positions).

### Why bundle pdfjs-dist instead of using CDN-only?
The library is imported as an ES module (`import * as pdfjsLib from "pdfjs-dist"`) so Astro tree-shakes it. The **worker** (~1.4 MB) is **self-hosted** in `public/pdf.worker.min.mjs`. We tried a CDN URL first and got bitten twice: (1) the hardcoded version drifted from the installed `pdfjs-dist` because of semver float, causing silent render failure on every page; (2) cross-origin module workers hit subtle browser quirks in privacy-focused browsers. The `scripts/sync-pdf-worker.mjs` hook copies the worker from `node_modules` on every `predev`/`prebuild`, so its version is always exactly the installed API version.

### Why jsdelivr for the PDFs (not GH Pages)?
Empirically, the user's India route to GitHub Pages was ~40× slower than jsdelivr for the same 700 KB file (43 s vs 1 s). GH Pages is single-vendor Fastly with one India edge; jsdelivr is a multi-CDN (Cloudflare + Fastly + StackPath) so the browser picks the fastest edge. jsdelivr mirrors any public GitHub repo at `/gh/<owner>/<repo>@<ref>/<path>` (per-file cap 20 MB — our biggest is 9 MB, fine). Trade-off: jsdelivr caches a published commit for up to ~10 min, so a brand-new PDF added to the repo might 404 briefly. The viewer error message handles this with a "try again shortly" hint, and `https://purge.jsdelivr.net/gh/spacechase26/ca-inter@main/<path>` can force-clear.

### Why render PDF page 1 from localStorage before reconciling with Apps Script?
The Apps Script call (cross-device resume) can take 500 ms – 2 s (more on cold starts). Awaiting it before rendering used to freeze the viewer for that full duration even though PDF.js had already parsed the file. Now `state.pdf = await loadPdf()` → `getLastPageLocal()` (sync) → `render()` → THEN `getLastPage()` (async, in background). If the remote disagrees with the local page, we flash "Synced to page N" and re-render. `isLocalFresh()` skips the remote call entirely when the local copy was written in the last 30 s, saving the round-trip on rapid remounts.

### Why `disableRange: true` for PDF.js?
PDF.js's default mode uses HTTP byte-range requests. For files under ~10 MB, the multiple round-trips dominate latency; a single GET is faster. We keep `disableStream: false` so PDF.js parses page 1 as bytes arrive, even though the request itself is one GET. Removing `disableRange: true` silently breaks the loading progress bar — the `onProgress` callback only fires per-chunk on a single full request, not on multi-range mode.

### Why a JS blob for the download button?
Browsers ignore the `download` attribute on cross-origin `<a>` elements unless the server sends `Content-Disposition: attachment` — jsdelivr doesn't, so clicking the ⤓ used to navigate-and-render inline rather than save. The viewer's download handler instead uses `state.pdf.getData()` (already in memory, no network) → Blob → `URL.createObjectURL` → invisible `<a download>` click. Falls back to a fetch + blob if PDF isn't loaded yet, with a final fallback to opening in a new tab.

### Why use `getStaticPaths` for chapter routes instead of dynamic client-side routing?
- SEO + shareability: each chapter has a real `/ca-inter/syllabus/<slug>/index.html`.
- No SPA hydration overhead.
- Build time is fast (~8s for 49 pages on this VPS).

**Caveat**: adding a NEW chapter row to the Sheet won't get a route until the next `git push` rebuilds the static site. Existing chapters' content updates live without rebuilding.

### Why does the live POST to Apps Script "fail" but still work?
`curl -X POST` to an Apps Script `/exec` URL returns an HTML "Page not found" because of how Google's edge handles the POST → redirect flow. But the script DOES execute and the write DOES land. Verified by GET-after-POST returning the new value. Our `sync.ts` fires-and-forgets the POST (doesn't read the response body), so the HTML response is harmless.

### Why publish to web instead of using the Sheets API?
- No OAuth.
- No API key management.
- No secrets in the client.
- Trade-off: 5–15 min cache (Google's, we can't beat it).

---

## 6. Build / deploy workflow

```sh
# Local dev (this VPS)
cd /home/coder/ca-inter
npm install       # one-time
npm run dev       # http://138.124.50.18:4323/ca-inter

# Manual build verification
npm run build     # outputs dist/

# Deploy (auto)
git push          # triggers .github/workflows/deploy.yml
                  # build job: withastro/action@v3
                  # deploy job: actions/deploy-pages@v4
                  # ~2 min total; live at spacechase26.github.io/ca-inter
```

CI fails if Pages source is set to "Deploy from a branch" instead of "GitHub Actions". One-time settings step at `https://github.com/spacechase26/ca-inter/settings/pages` → Source: GitHub Actions.

---

## 7. Configuration hardcoded into the code

These need to change if the Sheet or Apps Script is re-created from scratch:

| Constant | File | Source |
|---|---|---|
| `SHEET_PUBLISHED_ID` | `src/lib/sheets.ts` | from `File → Share → Publish to web` URL: `/d/e/<this>/pubhtml` |
| `TAB_GIDS` (10 entries) | `src/lib/sheets.ts` | the `gid=N` query param when you click each tab in the editor URL bar |
| `APPS_SCRIPT_URL` | `src/lib/sync.ts` | the `/exec` URL when you deploy `Code.gs` as a web app |

See `SECRETS_AND_CLEANUP.md` for rotation steps if anything leaks or you want to migrate.

---

## 8. Things that intentionally don't exist (yet)

- Service worker / offline app shell
- Dark mode
- Print stylesheets
- Search across chapters
- Analytics
- User accounts (single-user by design)
- Multi-language

Don't add these without a real reason — they introduce real cost (testing, maintenance, edge cases) for personal use.
