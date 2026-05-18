#!/usr/bin/env python3
"""
Emit two artifacts from the ICAI inventory:

  1. scripts/pdfs-seed.csv      → import this into the Google Sheet's `11 · PDFs` tab
  2. src/data/snapshots/pdfs.json → the bundled fallback the Astro build uses

The CSV matches every other tab's shape (col A blank, 4-row title block,
row 5 = headers, row 6+ = data). The JSON uses {headers, rows} like the
other snapshots so getSheet/getSnapshot work uniformly.

Usage:
    cd /home/coder/ca-inter
    python3 scripts/seed-pdfs-tab.py
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from icai_inventory import ALL

REPO = HERE.parent
OUT = HERE / "pdfs-seed.csv"
SNAPSHOT = REPO / "src" / "data" / "snapshots" / "pdfs.json"

HEADERS = ["Category", "Paper", "Ch#", "Title", "Path", "Pages", "Notes"]
TITLE = "📄  PDFs"
SUBTITLE = "Library of every PDF the site can render. One row per PDF. The chapter pages look up rows by Paper + Ch#."


def main() -> int:
    # 1) CSV for Google Sheet import
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        # column A is left blank everywhere (visual margin)
        w.writerow([""] * 8)                                          # row 1
        w.writerow(["", TITLE] + [""] * 6)                            # row 2
        w.writerow(["", SUBTITLE] + [""] * 6)                         # row 3
        w.writerow([""] * 8)                                          # row 4
        w.writerow([""] + HEADERS)                                    # row 5
        for p in ALL:
            w.writerow([
                "",
                p.category,
                p.paper if p.paper else "",
                p.chapter if p.chapter else "",
                p.title,
                p.local_path,
                "",                # Pages — fill in if you care
                p.notes,
            ])

    # 2) JSON snapshot (build-time fallback bundled into the site)
    rows = []
    for p in ALL:
        rows.append({
            "Category": p.category,
            "Paper": p.paper if p.paper else None,
            "Ch#": p.chapter if p.chapter else None,
            "Title": p.title,
            "Path": p.local_path,
            "Pages": None,
            "Notes": p.notes if p.notes else None,
        })
    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(
        json.dumps({"headers": HEADERS, "rows": rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    counts: dict[str, int] = {}
    for p in ALL:
        counts[p.category] = counts.get(p.category, 0) + 1
    summary = ", ".join(f"{cat}={n}" for cat, n in counts.items())
    print(f"  CSV     {OUT.relative_to(REPO)} ({len(ALL)} rows)")
    print(f"  JSON    {SNAPSHOT.relative_to(REPO)} ({len(ALL)} rows)")
    print(f"  Totals  {summary}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
