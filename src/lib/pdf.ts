import type { Chapter, PdfRecord } from "../types/sheet";

/**
 * PDF path + storage-key helpers.
 *
 * Sheet's `Path` column holds bare paths like `icai/study-material/p4-costing/ch02.pdf`.
 * `resolvePdf` returns the URL the browser should fetch.
 *
 * In production, PDFs are served from jsdelivr's global CDN instead of GitHub
 * Pages. The GH Pages → India route was empirically ~40× slower than jsdelivr
 * (43 s vs 1 s for a 700 KB PDF). jsdelivr mirrors any public GitHub repo at
 * `/gh/<owner>/<repo>@<ref>/<file>` and accepts PDFs up to 20 MB. Dev still
 * serves from the local origin so unpushed files work.
 */
const JSDELIVR_PDF_BASE =
  "https://cdn.jsdelivr.net/gh/spacechase26/ca-inter@main/public";

export function resolvePdf(path: string): string {
  if (/^https?:/.test(path)) return path;
  let clean = path.replace(/^\/+/, "");
  // The Sheet's Path column uses paths relative to public/pdfs/ (e.g.
  // `icai/rtp/p4-may2026.pdf`). Auto-prepend `pdfs/` so users don't have to
  // type the redundant directory. If a path already starts with `pdfs/`,
  // keep it (back-compat with the retired Syllabus PDF URL column).
  if (!clean.startsWith("pdfs/")) clean = `pdfs/${clean}`;

  if (import.meta.env.PROD) {
    return `${JSDELIVR_PDF_BASE}/${clean}`;
  }
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/${clean}`;
}

/** Storage key for cross-device resume — strip directory + extension, lowercase. */
export function pdfKey(path: string): string {
  return slugifyPath(path);
}

/** URL-safe slug for a PDF's path, used by /library/[slug] routes. */
export function pdfSlug(path: string): string {
  return slugifyPath(path);
}

function slugifyPath(path: string): string {
  return path
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Filter a list of PDFs to the ones that apply to a given chapter. */
export function pdfsForChapter(chapter: Chapter, all: PdfRecord[]): PdfRecord[] {
  const myPaper = chapter.Paper;
  const myCh = String(chapter["Ch#"] ?? "");

  // For Paper 6 RTPs/QPs, the Sheet uses "P6" — match against both P6A and P6B chapters.
  const isP6 = myPaper === "P6A" || myPaper === "P6B";

  return all.filter((p) => {
    const pdfPaper = (p.Paper ?? "").trim();
    const pdfCh = String(p["Ch#"] ?? "").trim();

    // Paper match: exact, or "" (paper-wide-across-all), or "P6" matches both P6A/P6B
    const paperMatches =
      pdfPaper === "" ||
      pdfPaper === myPaper ||
      (pdfPaper === "P6" && isP6);

    if (!paperMatches) return false;

    // Chapter match: empty in PDFs tab = paper-wide → applies to every chapter of that paper.
    // Otherwise needs exact Ch# match.
    if (pdfCh === "") return true;
    return pdfCh === myCh;
  });
}

/** Group a list of PDFs by Category, preserving first-seen order. */
export function groupByCategory(pdfs: PdfRecord[]): Array<{ category: string; items: PdfRecord[] }> {
  const order: string[] = [];
  const map = new Map<string, PdfRecord[]>();
  for (const p of pdfs) {
    const c = p.Category || "Other";
    if (!map.has(c)) {
      map.set(c, []);
      order.push(c);
    }
    map.get(c)!.push(p);
  }
  return order.map((c) => ({ category: c, items: map.get(c)! }));
}

/** Stable, kebab-cased CSS key for a category (for accent styling). */
export function categoryKey(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
