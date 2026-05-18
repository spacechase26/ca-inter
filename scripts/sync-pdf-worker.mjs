#!/usr/bin/env node
// Copies the installed pdfjs worker into public/ so it ships with the static build.
// Keeps the worker version locked to the API version — no CDN, no drift.
// Runs automatically before every `npm run build` and `npm run dev` via the
// `predev` / `prebuild` hooks in package.json.

import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

await mkdir(dirname(dest), { recursive: true });
await copyFile(src, dest);
console.log(`✓ Synced pdf.worker.min.mjs → public/`);
