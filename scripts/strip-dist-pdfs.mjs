#!/usr/bin/env node
// Remove dist/pdfs/ after the Astro build so the GitHub Pages artifact
// doesn't ship 135 MB of PDFs that nobody fetches — the live site loads
// every PDF from jsdelivr (see src/lib/pdf.ts), so GH Pages serving them
// is pure waste. Cuts the deploy artifact from ~140 MB to ~4 MB.
//
// The original files stay in public/pdfs/ (so they're in the git repo,
// where jsdelivr mirrors them). We only strip the BUILT copy.
//
// Runs automatically after `npm run build` via the postbuild hook in
// package.json.

import { rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const target = resolve(root, "dist/pdfs");

try {
  const before = await stat(target);
  if (before.isDirectory()) {
    // Walk for byte total before deletion (informational only)
    await rm(target, { recursive: true, force: true });
    console.log(`✓ Removed dist/pdfs/ (served via jsdelivr instead)`);
  }
} catch (err) {
  if (err && err.code === "ENOENT") {
    // No dist/pdfs — nothing to do (dev or first build before the dir exists)
    console.log("· dist/pdfs/ not present, skipping");
  } else {
    throw err;
  }
}
