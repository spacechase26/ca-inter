/**
 * Cross-device PDF-page sync via Google Apps Script.
 *
 * Deploy `apps-script/Code.gs` as a Web App ("Execute as: me, Access: Anyone with link"),
 * then paste the deployment URL into APPS_SCRIPT_URL below. Until set, the resume
 * feature works locally (localStorage only).
 */

export const APPS_SCRIPT_URL: string = ""; // <-- paste your /exec URL here

const LS_PREFIX = "pdf:lastPage:";
const POST_DEBOUNCE_MS = 1500;

function lsGet(key: string): number {
  try {
    const v = localStorage.getItem(LS_PREFIX + key);
    if (!v) return 1;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

function lsSet(key: string, page: number): void {
  try {
    localStorage.setItem(LS_PREFIX + key, String(page));
  } catch {
    /* ignore */
  }
}

export async function getLastPage(key: string): Promise<number> {
  if (!APPS_SCRIPT_URL) return lsGet(key);
  try {
    const url = `${APPS_SCRIPT_URL}?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const body = JSON.parse(text);
    const page = Number(body?.page);
    const remote = Number.isFinite(page) && page > 0 ? page : 1;
    // Keep localStorage warm as offline fallback
    lsSet(key, remote);
    return remote;
  } catch {
    return lsGet(key);
  }
}

const pending = new Map<string, ReturnType<typeof setTimeout>>();

export function setLastPage(key: string, page: number): void {
  // Always write through to localStorage immediately (fast + offline safe)
  lsSet(key, page);

  if (!APPS_SCRIPT_URL) return;

  // Debounce the remote write
  const existing = pending.get(key);
  if (existing) clearTimeout(existing);
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      void postState(key, page);
    }, POST_DEBOUNCE_MS),
  );
}

async function postState(key: string, page: number): Promise<void> {
  try {
    // Apps Script web apps don't honour CORS pre-flight for application/json,
    // so we send text/plain; the doPost handler parses the body itself.
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ key, page }),
    });
  } catch {
    // The localStorage write already happened; the next successful GET will
    // re-seed remote state if the user comes back online and reloads.
  }
}

export function isSyncConfigured(): boolean {
  return APPS_SCRIPT_URL !== "";
}
