# Maintenance — how to make changes

Quick recipes for common edits. Each section is self-contained.

If you're using AI to do these for you, paste the section into the prompt as context.

---

## 1. Edit study data (most common — no code, no push)

This covers: logging hours, marking chapters/days as done, recording mock scores, adding notes, ticking off key dates.

Just edit the Google Sheet. From any device. The website refetches every load and shows your latest data within 5–15 minutes (Google's CSV cache delay — there's nothing we can do to make it faster).

If you want the website to refresh immediately, click the **↻ Refresh** button in the top-right of any page. It clears the browser's local cache and re-fetches.

**No git push needed for any of this.**

---

## 2. Managing the PDF library

The site reads its PDF list from a single source of truth: the **`11 · PDFs`** tab in your Google Sheet. Each row maps one PDF file (sitting in `public/pdfs/...`) to a Category, Paper, and optional Chapter#. The chapter detail page picks up everything that applies to that chapter; the `/library` page shows everything.

### 2a. Folder convention

Every PDF lives under `public/pdfs/<category-folder>/<file>.pdf`:

```
public/pdfs/
├── icai/
│   ├── study-material/p4-costing/ch01.pdf  …  p6b-sm/ch05.pdf
│   ├── rtp/    p4-may2026.pdf, p5-jan2026.pdf, …
│   └── qp/     p4-may2024.pdf, p4-sep2024.pdf, …
├── mtp/        ← drop login-only ICAI Mock Test Papers here
├── external/   ← paid coaching material, free YouTube channel notes
├── scanners/   ← practice scanners (Vsmart, Aldine, etc.)
├── notes/      ← your typed / handwritten summaries
└── charts/     ← mind maps, formula sheets, one-pagers
```

Filenames: lowercase, hyphen-separated, two-digit chapter numbers (`ch02`, not `ch2`), no spaces. The bit before `.pdf` is the storage key for the cross-device resume — so renaming a PDF resets its remembered last-page (you can edit the hidden `ReadingState` tab to migrate).

### 2b. Adding one PDF (the 3-step flow)

```sh
cd /home/coder/ca-inter

# 1. Drop the file into the right subfolder
cp ~/Downloads/my-summary.pdf public/pdfs/notes/p4-ch2-material-cost-summary.pdf
```

```text
# 2. In the Google Sheet → `11 · PDFs` tab → append a row:
Category=Notes  Paper=P4  Ch#=2
Title=Material Cost — my one-page summary
Path=notes/p4-ch2-material-cost-summary.pdf
Pages=3  Notes=Hand-written
```

```sh
# 3. Commit + push so Pages serves the new file
git add public/pdfs/notes/p4-ch2-material-cost-summary.pdf
git commit -m "Add P4 Ch2 summary note"
git push
```

The site picks up the new row from your Sheet within 5–15 min (Google CSV cache). Click **↻ Refresh** in the nav to force it sooner. The PDF itself is live as soon as GitHub Pages re-deploys (~2 min after `git push`).

### 2c. Paper-wide vs chapter-specific

| Sheet row | Where it shows |
|---|---|
| `Paper=P4`, `Ch#=2` | Only on `/syllabus/p4-ch2-material-cost` |
| `Paper=P4`, `Ch#=` (blank) | On EVERY P4 chapter page (e.g. ICAI module IPs, RTPs, QPs) |
| `Paper=P6`, `Ch#=` (blank) | On all P6A AND P6B chapter pages (handles combined FM+SM RTPs/QPs) |
| `Paper=` (blank), `Ch#=` (blank) | Reserved for cross-paper material (rare) |

### 2d. Linking one PDF to multiple chapters

Two ways:
- **Same paper, multiple chapters** → add multiple rows, same Path, different Ch#.
- **Truly paper-wide** → leave Ch# blank. Auto-shows on every chapter of that paper.

All rows pointing at the same Path share the cross-device resume position (since the filename is the storage key).

### 2e. Adding a brand-new category

The chapter page groups by whatever Category string appears in the Sheet. To add a new one (e.g., `Cheat Sheets`):

1. Type `Cheat Sheets` in the Category column of new rows.
2. Optional: drop a matching `--cat-cheat-sheets` accent color into `src/components/PdfCard.astro` (or the card will fall back to neutral grey).

### 2f. Pulling a NEW ICAI edition (when ICAI publishes one)

When ICAI rolls a new edition (e.g. "Sep 2027 onwards"), three steps:

```sh
cd /home/coder/ca-inter

# 1. Update the URL table — paste new URLs into scripts/icai_inventory.py
#    Source pages: https://www.icai.org/post/sm-inter-p4-<attempt>  (etc.)
#    Use AI to scrape: "List every resource.cdn.icai.org URL on <page>"

# 2. Re-fetch (idempotent — only downloads what's missing or --force'd)
python3 scripts/fetch-icai-pdfs.py
# or:  python3 scripts/fetch-icai-pdfs.py --force --only P4

# 3. Regenerate seed CSV + snapshot, re-import into Sheet
python3 scripts/seed-pdfs-tab.py
# Then in the Sheet: clear the data rows in `11 · PDFs`, File → Import → Append the new CSV

git add scripts/ src/data/snapshots/pdfs.json public/pdfs/
git commit -m "Refresh ICAI material for <attempt>"
git push
```

### 2g. Retiring a PDF

1. Delete the row from the Sheet's `11 · PDFs` tab.
2. `rm public/pdfs/<path>` to reclaim repo space (optional but recommended).
3. `git push`.

### 2h. MTPs — manual upload (login required)

ICAI hides Mock Test Papers behind a BoS Knowledge Portal login, so `fetch-icai-pdfs.py` can't grab them. To add MTPs:

1. Log into https://boslive.icai.org with your ICAI student credentials.
2. Navigate to *Mock Test Papers* → CA Intermediate → your attempt's series.
3. Download each PDF for Papers 4, 5, 6.
4. Drop into `public/pdfs/mtp/` (e.g. `p4-may2026-series1.pdf`, `p5-may2026-series2.pdf`).
5. Add corresponding rows to the Sheet's `11 · PDFs` tab with Category=`MTP`.
6. `git push`.

---

## 3. Add a new chapter row

If the ICAI syllabus changes mid-prep (rare) or you want to break a chapter into sub-units:

1. **In the Sheet**: add a new row to the Syllabus tab with all columns filled (`#`, `Paper`, `Ch#`, `Chapter / Unit`, `Priority`, etc.).
2. **Push a no-op commit** so GitHub Actions regenerates the static chapter route:
   ```sh
   cd /home/coder/ca-inter
   git commit --allow-empty -m "Pick up new chapter row"
   git push
   ```
   This is needed because chapter detail routes are generated at build time via `getStaticPaths`. The Sheet → live data flow handles values, but the route list is baked into the build.

---

## 4. Change the visual design

| Want to change | Edit this file |
|---|---|
| Color palette (cream, ink, paper accents) | `src/styles/tokens.css` |
| Typography (font sizes, families) | `src/styles/tokens.css` |
| Card / chip / button base styles | `src/styles/base.css` |
| Top nav layout | `src/layouts/Base.astro` |
| Dashboard layout (KPIs, today, mocks, week) | `src/pages/index.astro` |
| Syllabus grid layout | `src/pages/syllabus/index.astro` |
| Chapter detail page | `src/pages/syllabus/[chapter].astro` |
| Daily plan row appearance | `src/components/DailyRow.astro` |
| PDF viewer toolbar | `src/components/PdfViewer.astro` |

After editing: `npm run dev` to preview locally, then `git push` to deploy.

---

## 5. Update the bundled snapshot (offline fallback)

The snapshot in `src/data/snapshots/*.json` is used when the live Sheet fetch fails. It's bundled at build time from the LOCAL `/home/coder/CA_INTER_G2_Planner_v1.xlsx` (NOT the Google Sheet).

If you re-generate the xlsx (e.g. you re-run `build_planner.py` to tweak the planner) and want the offline fallback to reflect the new state:

```sh
cd /home/coder/ca-inter
PYTHONPATH=/home/coder/.python_libs python3 scripts/generate-snapshots.py
git add src/data/snapshots/
git commit -m "Refresh snapshot from xlsx"
git push
```

You can also just leave the snapshot stale — once your Sheet is published, it's the source of truth and the snapshot only matters when CSV fetch fails.

---

## 6. View the live build / debug a failed deploy

- **Action runs**: https://github.com/spacechase26/ca-inter/actions
- Click any run → expand the failing step to see logs.
- Most common failure: Pages source still set to "Deploy from a branch" instead of "GitHub Actions". Fix at https://github.com/spacechase26/ca-inter/settings/pages.

To re-trigger a deploy without making a real change:
```sh
git commit --allow-empty -m "Re-trigger deploy"
git push
```

---

## 7. The dev server (this VPS)

```sh
cd /home/coder/ca-inter
npm run dev   # foreground, http://138.124.50.18:4323/ca-inter
```

If port 4323 is already in use (another instance running), check:
```sh
ps aux | grep "astro dev" | grep -v grep
```

Kill it with `kill <PID>` if you want to restart fresh.

---

## 8. Common Sheet edits and where they show up

| Sheet change | Where on the site |
|---|---|
| Mark `Done?` = TRUE on a chapter | Syllabus card grays out, dashboard "% chapters done" updates |
| Log `Actual hrs` on a daily row | Today card + dashboard "Actual logged" total |
| Log `Marks scored` + `Done date` on a mock | Mocks page shows ✓ and % score; dashboard "Average score" recomputes |
| Edit a chapter's `PDF URL` | Chapter detail page mounts the PDF viewer |
| Add a row to Resources | Resources page picks it up automatically |
| Edit a Wellness section item | Wellness page reflects it (after CSV refresh) |

Remember: the Sheet's edit lag to published CSV is 5–15 min. The Refresh button only beats Google's cache from the BROWSER side — if Google's CDN hasn't refreshed yet, even Refresh won't help.

---

## 9. Backup

The whole project is in two places already:
- GitHub: `spacechase26/ca-inter` — entire codebase including the snapshot fallback
- Google Drive: your Sheet + the original xlsx upload

To make an offline backup of the live data: open the Sheet in Drive → *File → Download → Microsoft Excel (.xlsx)*. Save somewhere safe.

---

## 10. When in doubt

Ask an AI assistant (Claude, GPT, etc.) with this context:
1. The repo URL
2. The file you want to change
3. What you want it to do

Or paste `ARCHITECTURE.md` + the relevant section of this file as system context. The codebase is small (~3000 lines) and well-typed — any modern AI can navigate it cleanly.
