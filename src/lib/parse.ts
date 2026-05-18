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
 * Coerce a raw CSV cell string into number / boolean / null / string.
 * Empty strings become null; numeric strings become numbers; "TRUE"/"FALSE"
 * (Sheets' bool serialization) become booleans.
 */
export function coerce(raw: string | undefined | null): unknown {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  if (s === "TRUE" || s === "true") return true;
  if (s === "FALSE" || s === "false") return false;
  // numeric? allow optional leading minus and decimals
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return s;
}
