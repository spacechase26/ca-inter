/**
 * Browser-local-time helpers for matching Daily Plan rows.
 * All Sheet date columns are stored as ISO `YYYY-MM-DD`; we compare on that string.
 */

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string): Date {
  // parse `YYYY-MM-DD` as a local date (avoid TZ shift from new Date(iso))
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(from: string, to: string): number {
  const ms = isoToDate(to).getTime() - isoToDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatPretty(iso: string): string {
  const d = isoToDate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
