/**
 * Client-side live refresh.
 *
 * The page is server-rendered from the build-time snapshot, so structure,
 * dates and "today" are already correct. This module overlays the volatile,
 * user-entered columns from the *live* published Google Sheet — Actual hrs,
 * Done?, Confidence, Notes — onto the rendered rows (matched by plan row #),
 * plus the dashboard's "Actual logged" hours total.
 *
 * Runs on load, every 5 minutes, on tab refocus, and when the Refresh button
 * fires `ca:refresh`. Every failure falls back to whatever the server
 * rendered, so it can never make the page worse than the snapshot.
 */
import { csvUrl } from "./sheets";
import { parseSheetCsv } from "./parse";
import { cacheGet, cacheSet } from "./cache";
import type { SheetData } from "../types/sheet";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type Row = Record<string, unknown>;

async function loadDaily(force: boolean): Promise<SheetData | null> {
  if (!force) {
    const cached = cacheGet<SheetData>("daily", CACHE_TTL_MS);
    if (cached) return cached;
  }
  const url = csvUrl("daily", force);
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseSheetCsv(await res.text());
    if (parsed.rows.length === 0) throw new Error("empty CSV");
    cacheSet("daily", parsed);
    return parsed;
  } catch {
    return null; // keep whatever the server rendered
  }
}

function fillSlot(row: Element, field: string, value: unknown, fmt: (v: unknown) => string): void {
  const slot = row.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!slot) return;
  const has = value !== null && value !== undefined && value !== "";
  slot.hidden = !has;
  if (has) {
    const target = slot.querySelector<HTMLElement>("[data-field-value]") ?? slot;
    target.textContent = fmt(value);
  }
}

function patchRows(rows: Row[]): void {
  const byNum = new Map<number, Row>();
  for (const r of rows) {
    const n = Number(r["#"]);
    if (Number.isFinite(n) && n > 0) byNum.set(n, r);
  }
  document.querySelectorAll<HTMLElement>(".daily[data-n]").forEach((el) => {
    const row = byNum.get(Number(el.dataset.n));
    if (!row) return;
    fillSlot(el, "actual", row["Actual hrs"], (v) => `${v}h`);
    fillSlot(el, "confidence", row["Confidence"], (v) => `${v}/5`);
    fillSlot(el, "notes", row["Notes"], (v) => String(v));
    const done = row["Done?"] === true;
    el.classList.toggle("daily--done", done);
    const doneEl = el.querySelector<HTMLElement>('[data-field="done"]');
    if (doneEl) doneEl.hidden = !done;
  });
}

function patchHoursTotal(rows: Row[]): void {
  const hint = document.querySelector<HTMLElement>('.kpi[data-kpi="plan-hours"] .kpi__hint');
  if (!hint) return;
  const total = rows.reduce((sum, r) => {
    if (!r["Date"]) return sum; // skip the Sheet's footer/summary row (matches server)
    const v = r["Actual hrs"];
    return sum + (typeof v === "number" ? v : 0);
  }, 0);
  hint.textContent = `Actual logged: ${Math.round(total)}h`;
}

let inFlight = false;
async function refresh(force: boolean): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const data = await loadDaily(force);
    if (!data) return;
    patchRows(data.rows);
    patchHoursTotal(data.rows);
  } finally {
    inFlight = false;
  }
}

export function initLive(): void {
  void refresh(false);
  window.setInterval(() => void refresh(false), REFRESH_INTERVAL_MS);
  window.addEventListener("ca:refresh", () => void refresh(true));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void refresh(false);
  });
}
