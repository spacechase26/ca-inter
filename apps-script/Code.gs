/**
 * CA Inter G2 — PDF reading-state sync.
 *
 * Deployment instructions:
 *   1. Open your planner Google Sheet
 *   2. Extensions → Apps Script → replace any existing code with this file
 *   3. In the same Sheet, add a NEW tab named exactly: ReadingState
 *      Row 1 (header):  PdfKey  |  LastPage
 *      Hide the tab so it doesn't clutter the main view (right-click tab → Hide)
 *   4. Apps Script editor: Deploy → New deployment
 *        Type: Web app
 *        Execute as: Me
 *        Who has access: Anyone with the link
 *      Copy the resulting /exec URL
 *   5. Paste it into src/lib/sync.ts as APPS_SCRIPT_URL
 *
 * Re-deploying: every code change requires Deploy → Manage deployments → edit
 *               → New version. The URL stays the same across re-deploys.
 */

const TAB_NAME = 'ReadingState';

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(TAB_NAME);
    sh.appendRow(['PdfKey', 'LastPage']);
    sh.hideSheet();
  }
  return sh;
}

function getState_(key) {
  if (!key) return 1;
  const sh = sheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      const n = Number(rows[i][1]);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }
  }
  return 1;
}

function setState_(key, page) {
  if (!key) return;
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const sh = sheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sh.getRange(i + 1, 2).setValue(p);
      return;
    }
  }
  sh.appendRow([key, p]);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const key = (e && e.parameter && e.parameter.key) || '';
  return jsonOut_({ page: getState_(key) });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    setState_(body.key, body.page);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
