# CA Inter Companion

A static viewer for your CA Inter Group 2 study planner. Reads live from your Google Sheet, ships an 87-PDF ICAI study library out of the box, renders PDFs inline (with cross-device resume), no database, no auth.

**Live:** https://spacechase26.github.io/ca-inter/

---

## One-time setup

### 1. Publish the planner Sheet

1. Upload `CA_INTER_G2_Planner_v1.xlsx` to Google Drive → open with Google Sheets
2. *File → Share → Publish to web*
3. Switch to **Specific sheets**; for each tab choose **Comma-separated values (.csv)** and click *Publish*
4. Copy each tab's URL — note the `gid` parameter
5. Paste `SHEET_PUBLISHED_ID` and the `TAB_GIDS` map (11 entries) into `src/lib/sheets.ts`

### 2. Wire up the PDF library

The library is driven by the `11 · PDFs` tab in your Sheet — one row per PDF (`Category | Paper | Ch# | Title | Path | Pages | Notes`). 87 ICAI PDFs are pre-seeded in `public/pdfs/icai/` and `scripts/pdfs-seed.csv`.

1. From the repo root: `python3 scripts/fetch-icai-pdfs.py` (idempotent; ~135 MB) — already done in this clone if `public/pdfs/icai/` is populated.
2. Add a new tab called `11 · PDFs` to your Sheet; *File → Import → Upload* `scripts/pdfs-seed.csv` → *Replace current sheet*. Re-publish (auto-republishes on edits).
3. Copy the new tab's `gid=` from the URL bar; paste into `TAB_GIDS.pdfs` in `src/lib/sheets.ts`.
4. To add your own PDFs (notes, charts, paid coaching material): drop into the right `public/pdfs/<category>/` subfolder + add a row to the `11 · PDFs` tab. See `MAINTENANCE.md` §2.

Production serves PDFs via **jsdelivr's CDN** (not GitHub Pages) — see `ARCHITECTURE.md` §5 for the 40×-speedup story. No config needed; the URL is built from your GitHub repo automatically.

### 3. Deploy the cross-device sync (Apps Script)

1. In the Sheet, *Extensions → Apps Script*
2. Paste the contents of `apps-script/Code.gs`
3. Add a hidden tab named `ReadingState` with header row `PdfKey | LastPage`
4. *Deploy → New deployment → Web app → Execute as: me, Access: Anyone with the link*
5. Copy the deployment URL → paste into `APPS_SCRIPT_URL` in `src/lib/sync.ts`

### 4. Push

```sh
git push
```

GitHub Actions builds + deploys to Pages in ~2 minutes.

---

## Daily workflow

- **Edit data** in the Google Sheets mobile app (hours logged, chapters done, mock scores)
- **View** at https://spacechase26.github.io/ca-inter/
- Sheet edits take **5–15 minutes** to show up on the site (Google's cache). The "🔄 Refresh data" button clears the browser cache for instant pickup — but it can't beat Google's server-side delay.

## When you need to push

- Adding a new PDF to `public/pdfs/` (file needs to be in the GitHub repo for jsdelivr to mirror it)
- Changing site code
- Adding/removing chapter rows (build re-generates the chapter route list)

Everything else (daily logs, mock scores, completion ticks, editing the `11 · PDFs` tab) — no push needed.

---

## Development

```sh
npm install
npm run dev   # http://localhost:4323
npm run build
```
