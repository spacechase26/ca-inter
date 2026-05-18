/**
 * URL-safe slug for a chapter name.
 *   "Audit of Items of Financial Statements" -> "audit-of-items-of-financial-statements"
 *   "Overheads – Absorption Costing"        -> "overheads-absorption-costing"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the unique chapter slug we use in URLs: `<paper>-ch<n>-<name>`. */
export function chapterSlug(paper: string, ch: number | string, name: string): string {
  return `${paper.toLowerCase()}-ch${ch}-${slugify(name)}`;
}
