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

## 2. Add a new PDF (study material or handwritten notes)

```sh
cd /home/coder/ca-inter

# 1. Drop the file into public/pdfs/
#    Use lowercase, hyphen-separated names. Keep them short and meaningful.
cp /path/to/your-file.pdf public/pdfs/material-cost.pdf

# 2. In the Google Sheet → Syllabus tab → find the chapter
#    Add the bare path (no leading slash) to the "PDF URL" column.
#    Example value: pdfs/material-cost.pdf
#    (Don't include the domain or /ca-inter/ prefix — pdf.ts resolves it.)

# 3. Commit and push
git add public/pdfs/material-cost.pdf
git commit -m "Add PDF: material cost"
git push
```

Within 2 minutes the chapter page at `/syllabus/p4-ch2-material-cost` (or whichever chapter you linked it to) will render the PDF inline. The Refresh button on the syllabus page picks up the new `PDF URL` Sheet value.

### Naming gotcha
The filename (minus `.pdf`) is the storage key for cross-device resume. If you rename a PDF, the saved last-page resets (because the key changes). To preserve reading position across a rename, also manually edit the `ReadingState` hidden tab in the Sheet — find the old key, change it to the new key.

### Linking the same PDF from multiple chapters
Allowed. All chapters that reference `pdfs/foo.pdf` will share one saved reading position. Useful when one PDF covers multiple chapters.

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
