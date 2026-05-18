/**
 * PDF path + storage-key helpers.
 *
 * The Sheet's `PDF URL` column holds bare paths like `pdfs/material-cost.pdf`.
 * We prepend the deploy base URL so links work both on localhost and at
 * /ca-inter/ in production.
 */

export function resolvePdf(path: string): string {
  if (/^https?:/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = path.replace(/^\/+/, "");
  return `${base}/${clean}`;
}

/** Storage key for cross-device resume: strip directory + .pdf, lowercase. */
export function pdfKey(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.pdf$/i, "").toLowerCase();
}
