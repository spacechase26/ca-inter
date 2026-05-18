import { cacheGet, cacheSet } from "./cache";
import { parseSheetCsv } from "./parse";
import type { SheetData, TabKey } from "../types/sheet";

import startHereSnap from "../data/snapshots/start-here.json";
import dashboardSnap from "../data/snapshots/dashboard.json";
import syllabusSnap from "../data/snapshots/syllabus.json";
import phasesSnap from "../data/snapshots/phases.json";
import dailySnap from "../data/snapshots/daily.json";
import mocksSnap from "../data/snapshots/mocks.json";
import keyDatesSnap from "../data/snapshots/key-dates.json";
import resourcesSnap from "../data/snapshots/resources.json";
import wellnessSnap from "../data/snapshots/wellness.json";
import notesSnap from "../data/snapshots/notes.json";

/**
 * --- Configuration ---------------------------------------------------------
 *
 * After publishing your Sheet to web:
 *   1. Copy the published-sheet ID (the long token between `/d/e/` and `/pub`)
 *   2. Paste it into SHEET_PUBLISHED_ID below
 *   3. For each tab, look at its publish URL, copy the `gid=...` value, and
 *      paste it into the TAB_GIDS map below
 *
 * Until SHEET_PUBLISHED_ID is non-empty, the site renders from the bundled
 * JSON snapshot of CA_INTER_G2_Planner_v1.xlsx. Once configured, the live CSV
 * takes priority and the snapshot becomes the offline / fetch-failure fallback.
 * --------------------------------------------------------------------------
 */
export const SHEET_PUBLISHED_ID: string =
  "2PACX-1vRdvz-leeAP8t43mtpaU9KY2PIJOc1XWCW32oMkhiMXGRSrlYWMItGi5Oz0iR91j4dgvWDP3Bl9cu1E";

export const TAB_GIDS: Record<TabKey, string> = {
  "start-here": "2065557944",
  dashboard:    "1026328095",
  syllabus:     "1505086469",
  phases:        "828842684",
  daily:        "1126892428",
  mocks:         "944393612",
  "key-dates":  "1800174009",
  resources:    "1407088913",
  wellness:     "1451834793",
  notes:        "1210908289",
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const SNAPSHOTS: Record<TabKey, SheetData> = {
  "start-here": startHereSnap as SheetData,
  dashboard:   dashboardSnap as SheetData,
  syllabus:    syllabusSnap as SheetData,
  phases:      phasesSnap as SheetData,
  daily:       dailySnap as SheetData,
  mocks:       mocksSnap as SheetData,
  "key-dates": keyDatesSnap as SheetData,
  resources:   resourcesSnap as SheetData,
  wellness:    wellnessSnap as SheetData,
  notes:       notesSnap as SheetData,
};

export function isLiveConfigured(): boolean {
  return SHEET_PUBLISHED_ID !== "" && Object.values(TAB_GIDS).every((g) => g !== "");
}

export function csvUrl(tab: TabKey, bust = false): string | null {
  if (!SHEET_PUBLISHED_ID || !TAB_GIDS[tab]) return null;
  let url =
    `https://docs.google.com/spreadsheets/d/e/${SHEET_PUBLISHED_ID}` +
    `/pub?gid=${TAB_GIDS[tab]}&single=true&output=csv`;
  if (bust) url += `&_=${Date.now()}`;
  return url;
}

/**
 * Fetch a tab's data. Order of preference:
 *   1. localStorage cache (≤5 min old)
 *   2. live Google Sheets CSV (cached on success)
 *   3. bundled JSON snapshot (always available)
 *
 * Snapshot is always returned synchronously when `force === false` AND no
 * live config: lets server-rendered pages emit content without a network round-trip.
 */
export async function getSheet(
  tab: TabKey,
  opts: { force?: boolean } = {}
): Promise<SheetData> {
  const url = csvUrl(tab, opts.force);
  if (!url) return SNAPSHOTS[tab];

  if (!opts.force) {
    const cached = cacheGet<SheetData>(tab, CACHE_TTL_MS);
    if (cached) return cached;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const parsed = parseSheetCsv(csv);
    if (parsed.rows.length === 0) throw new Error("empty CSV");
    cacheSet(tab, parsed);
    return parsed;
  } catch {
    // network / 404 / parse failure — fall back to snapshot
    return SNAPSHOTS[tab];
  }
}

/** Synchronous read of the bundled snapshot — for build-time use (getStaticPaths). */
export function getSnapshot(tab: TabKey): SheetData {
  return SNAPSHOTS[tab];
}
