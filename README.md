# CA Inter G2 Companion

A static viewer for your CA Inter Group 2 study planner. Reads live from your Google Sheet, renders PDFs inline (with cross-device resume), no database, no auth.

**Live:** https://spacechase26.github.io/ca-inter/

---

## One-time setup

### 1. Publish the planner Sheet

1. Upload `CA_INTER_G2_Planner_v1.xlsx` to Google Drive → open with Google Sheets
2. *File → Share → Publish to web*
3. Switch to **Specific sheets**; for each tab choose **Comma-separated values (.csv)** and click *Publish*
4. Copy each tab's URL — note the `gid` parameter
5. Paste `SHEET_PUBLISHED_ID` and the `TAB_GIDS` map into `src/lib/sheets.ts`

### 2. Wire up PDFs

1. Drop your study PDFs into `public/pdfs/` (lowercase, hyphenated filenames)
2. Add a `PDF URL` column to the Syllabus tab; fill each chapter with a bare path like `pdfs/material-cost.pdf`

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

- Adding a new PDF to `public/pdfs/`
- Changing site code
- Adding/removing chapter rows (build re-generates the chapter route list)

Everything else (daily logs, mock scores, completion ticks) — no push needed.

---

## Development

```sh
npm install
npm run dev   # http://localhost:4323
npm run build
```
