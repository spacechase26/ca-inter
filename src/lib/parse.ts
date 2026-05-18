import Papa from "papaparse";
import type { SheetData } from "../types/sheet";

const SKIP_ROWS_DEFAULT = 4;

/**
 * Parse a CSV string published from Google Sheets.
 *
 * The Sheet has decorative rows: an empty leading column (A) and a 4-row title
 * block (empty, title, subtitle, empty) above the real header row. We strip
 * both before papaparse sees real data.
 */
export function parseSheetCsv(csv: string, opts: { skipRows?: number } = {}): SheetData {
  const skipRows = opts.skipRows ?? SKIP_ROWS_DEFAULT;
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: false });
  const matrix = parsed.data;

  // remove leading empty column if column 0 is empty everywhere
  const stripLeadCol = matrix.every((row) => !row[0] || String(row[0]).trim() === "");
  const cleaned = stripLeadCol ? matrix.map((row) => row.slice(1)) : matrix;

  // drop the title block
  const data = cleaned.slice(skipRows);
  if (data.length === 0) return { headers: [], rows: [] };

  const rawHeaders = data[0]!.map((h) => (h ?? "").trim());
  // crop to last non-empty header
  let lastIdx = rawHeaders.length - 1;
  while (lastIdx >= 0 && !rawHeaders[lastIdx]) lastIdx--;
  const headers = rawHeaders.slice(0, lastIdx + 1);
  if (headers.length === 0) return { headers: [], rows: [] };

  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r] ?? [];
    const obj: Record<string, unknown> = {};
    let anyValue = false;
    for (let c = 0; c < headers.length; c++) {
      const raw = row[c];
      const value = coerce(raw);
      if (value !== null) anyValue = true;
      obj[headers[c]!] = value;
    }
    if (anyValue) rows.push(obj);
  }

  return { headers, rows };
}

/**
 * Coerce a raw CSV cell string into number / boolean / null / ISO date / string.
 * Empty strings become null; numeric strings become numbers; "TRUE"/"FALSE"
 * (Sheets' bool serialization) become booleans; display-format dates
 * ("18 May", "Mon 18 May", "27/05/2026", etc.) get normalized to YYYY-MM-DD
 * so date logic across the site stays uniform.
 */
export function coerce(raw: string | undefined | null): unknown {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  if (s === "TRUE" || s === "true") return true;
  if (s === "FALSE" || s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  const iso = tryParseDate(s);
  if (iso) return iso;
  // percent-formatted cell ("3%", "10.5%") -> fraction
  if (/^-?\d+(\.\d+)?%$/.test(s)) {
    const n = Number(s.slice(0, -1));
    if (Number.isFinite(n)) return n / 100;
  }
  return s;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Recognise common date renderings the Google Sheets CSV emits and
 * convert them to ISO `YYYY-MM-DD`. Year is inferred from the planner's
 * calendar (May–Dec → 2026, Jan–Apr → 2027) when the input omits it.
 *
 * Returns null if the string doesn't look like a date.
 */
export function tryParseDate(s: string): string | null {
  // already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // strip leading weekday + collapse whitespace: "Mon  18 May" -> "18 May"
  const noDow = s.replace(/^[A-Za-z]{3,9}[,\s]+/, "").replace(/\s+/g, " ").trim();

  // "18 May" or "18 May 2026"
  let m = noDow.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (m) {
    const day = Number(m[1]);
    const month = MONTH_MAP[m[2]!.toLowerCase().slice(0, m[2]!.toLowerCase().length === 4 ? 4 : 3)];
    if (!month) return null;
    const year = m[3] ? Number(m[3]) : inferPlannerYear(month);
    return isoDate(year, month, day);
  }

  // "May 18" or "May 18 2026"
  m = noDow.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (m) {
    const month = MONTH_MAP[m[1]!.toLowerCase().slice(0, m[1]!.toLowerCase().length === 4 ? 4 : 3)];
    if (!month) return null;
    const day = Number(m[2]);
    const year = m[3] ? Number(m[3]) : inferPlannerYear(month);
    return isoDate(year, month, day);
  }

  // numeric: "5/18/2026", "18/5/2026", "5/18/26", "18-05-2026"
  m = noDow.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    // Heuristic: if first part > 12, it's day-month-year (DMY); else month-day-year (MDY)
    const [day, month] = a > 12 ? [a, b] : [b, a];
    return isoDate(year, month, day);
  }

  return null;
}

function inferPlannerYear(month: number): number {
  // Plan spans 18 May 2026 → 8 Jan 2027. May-Dec is 2026, Jan-Apr is 2027.
  return month >= 5 ? 2026 : 2027;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
