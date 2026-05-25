/**
 * Client-side live refresh.
 *
 * Pages are server-rendered from the build-time snapshot, so structure, dates
 * and "today" are already correct. This module overlays the volatile,
 * user-entered columns from the *live* published Google Sheet on top of that:
 *
 *   - daily tab    → Actual hrs / Done? / Confidence / Notes per row (by #),
 *                    plus the dashboard "Actual logged" hours total.
 *   - syllabus tab → chapter Done? (list cards + detail chip) and Notes
 *                    (detail), plus the dashboard "Chapters done" %/count and
 *                    the syllabus-page completion count.
 *
 * Runs on load, every 5 minutes, on tab refocus, and on `ca:refresh` (the
 * Refresh button). A tab is only fetched when its data is present on the page.
 * Every failure falls back to whatever the server rendered, so it can never
 * make the page worse than the snapshot.
 */
import { csvUrl } from "./sheets";
import { parseSheetCsv } from "./parse";
import { cacheGet, cacheSet } from "./cache";
import type { SheetData, TabKey } from "../types/sheet";

const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type Row = Record<string, unknown>;

async function loadTab(tab: TabKey, force: boolean): Promise<SheetData | null> {
  if (!force) {
    const cached = cacheGet<SheetData>(tab, CACHE_TTL_MS);
    if (cached) return cached;
  }
  const url = csvUrl(tab, force);
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseSheetCsv(await res.text());
    if (parsed.rows.length === 0) throw new Error("empty CSV");
    cacheSet(tab, parsed);
    return parsed;
  } catch {
    return null; // keep whatever the server rendered
  }
}

function byNumber(rows: Row[]): Map<number, Row> {
  const m = new Map<number, Row>();
  for (const r of rows) {
    const n = Number(r["#"]);
    if (Number.isFinite(n) && n > 0) m.set(n, r);
  }
  return m;
}

/** Show/hide a `[data-field]` slot inside `scope` and fill its `[data-field-value]`. */
function fillSlot(scope: Element, field: string, value: unknown, fmt: (v: unknown) => string): void {
  const slot = scope.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!slot) return;
  const has = value !== null && value !== undefined && value !== "";
  slot.hidden = !has;
  if (has) {
    const target = slot.querySelector<HTMLElement>("[data-field-value]") ?? slot;
    target.textContent = fmt(value);
  }
}

// ---- daily tab -----------------------------------------------------------

function patchDailyRows(rows: Row[]): void {
  const byN = byNumber(rows);
  document.querySelectorAll<HTMLElement>(".daily[data-n]").forEach((el) => {
    const row = byN.get(Number(el.dataset.n));
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

// ---- syllabus tab --------------------------------------------------------

function patchChapters(rows: Row[]): void {
  const byN = byNumber(rows);

  // Syllabus list cards: toggle the faded "done" state + the ✓ tag.
  document.querySelectorAll<HTMLElement>(".ch[data-ch]").forEach((el) => {
    const row = byN.get(Number(el.dataset.ch));
    if (!row) return;
    const done = row["Done?"] === true;
    el.classList.toggle("ch--done", done);
    const tag = el.querySelector<HTMLElement>('[data-field="done"]');
    if (tag) tag.hidden = !done;
  });

  // Chapter detail page: the done chip + the Notes section each carry data-ch.
  document.querySelectorAll<HTMLElement>('[data-field="done"][data-ch]').forEach((el) => {
    const row = byN.get(Number(el.dataset.ch));
    if (row) el.hidden = row["Done?"] !== true;
  });
  document.querySelectorAll<HTMLElement>('[data-field="notes"][data-ch]').forEach((el) => {
    const row = byN.get(Number(el.dataset.ch));
    if (!row) return;
    const notes = row["Notes"];
    const has = notes !== null && notes !== undefined && notes !== "";
    el.hidden = !has;
    if (has) {
      const target = el.querySelector<HTMLElement>("[data-field-value]") ?? el;
      target.textContent = String(notes);
    }
  });
}

function patchChaptersTotals(rows: Row[]): void {
  const chapters = rows.filter((r) => r["Paper"]); // matches the server's filter
  const total = chapters.length;
  const done = chapters.filter((r) => r["Done?"] === true).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const kpi = document.querySelector<HTMLElement>('.kpi[data-kpi="chapters-done"]');
  if (kpi) {
    const val = kpi.querySelector<HTMLElement>(".kpi__value");
    const hint = kpi.querySelector<HTMLElement>(".kpi__hint");
    if (val) val.textContent = `${pct}%`;
    if (hint) hint.textContent = `${done} / ${total}`;
  }

  const sylDone = document.querySelector<HTMLElement>("[data-syl-done]");
  if (sylDone) sylDone.textContent = String(done);
}

// ---- orchestration -------------------------------------------------------

let inFlight = false;
async function refresh(force: boolean): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const tasks: Promise<void>[] = [];

    if (
      document.querySelector(".daily[data-n]") ||
      document.querySelector('.kpi[data-kpi="plan-hours"]')
    ) {
      tasks.push(
        loadTab("daily", force).then((d) => {
          if (!d) return;
          patchDailyRows(d.rows);
          patchHoursTotal(d.rows);
        }),
      );
    }

    if (
      document.querySelector("[data-ch]") ||
      document.querySelector('.kpi[data-kpi="chapters-done"]')
    ) {
      tasks.push(
        loadTab("syllabus", force).then((d) => {
          if (!d) return;
          patchChapters(d.rows);
          patchChaptersTotals(d.rows);
        }),
      );
    }

    await Promise.all(tasks);
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
