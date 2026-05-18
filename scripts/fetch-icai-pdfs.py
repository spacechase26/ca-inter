#!/usr/bin/env python3
"""
Pull every ICAI PDF in scripts/icai_inventory.py into public/pdfs/.

Idempotent — skips files that already exist (cheap re-runs).
Retries each download up to 3 times with 5 s backoff on 5xx / network errors.

Usage:
    cd /home/coder/ca-inter
    python3 scripts/fetch-icai-pdfs.py
    python3 scripts/fetch-icai-pdfs.py --force        # re-download even if present
    python3 scripts/fetch-icai-pdfs.py --only=P5      # filter by paper code
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# scripts/icai_inventory.py lives next door
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from icai_inventory import ALL, Pdf

REPO_ROOT = HERE.parent
PUBLIC_PDFS = REPO_ROOT / "public" / "pdfs"
UA = "Mozilla/5.0 (CA Inter G2 companion fetcher)"
RETRIES = 3
BACKOFF_SECONDS = 5
TIMEOUT_SECONDS = 60


def fetch(url: str, dest: Path) -> int:
    """Download `url` to `dest` (atomic via .part rename). Returns bytes written."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/pdf,*/*"})
    last_exc: Exception | None = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urlopen(req, timeout=TIMEOUT_SECONDS) as resp, tmp.open("wb") as out:
                total = 0
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    out.write(chunk)
                    total += len(chunk)
            tmp.rename(dest)
            return total
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            last_exc = exc
            if tmp.exists():
                try:
                    tmp.unlink()
                except OSError:
                    pass
            if attempt < RETRIES:
                time.sleep(BACKOFF_SECONDS)
            else:
                raise
    raise RuntimeError(f"unreachable; last={last_exc}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true",
                        help="re-download even if local copy already exists")
    parser.add_argument("--only", default="",
                        help="filter: download only entries whose paper matches this code (e.g. P4)")
    args = parser.parse_args()

    queue: list[Pdf] = []
    for p in ALL:
        if args.only and p.paper != args.only:
            continue
        queue.append(p)

    print(f"Fetcher target: {len(queue)} files → {PUBLIC_PDFS}")
    print(f"Force redownload: {args.force}")
    print()

    ok = skipped = failed = 0
    total_bytes = 0
    fails: list[tuple[Pdf, str]] = []

    for i, p in enumerate(queue, 1):
        dest = PUBLIC_PDFS / p.local_path
        label = f"[{i:3d}/{len(queue)}] {p.category:21s} {p.paper:4s} {p.title[:55]}"
        if dest.exists() and not args.force:
            print(f"  SKIP  {label}  ({dest.stat().st_size / 1024 / 1024:.2f} MB on disk)")
            skipped += 1
            total_bytes += dest.stat().st_size
            continue
        try:
            n = fetch(p.url, dest)
            print(f"  OK    {label}  ({n / 1024 / 1024:.2f} MB)")
            ok += 1
            total_bytes += n
        except Exception as exc:  # noqa: BLE001
            print(f"  FAIL  {label}  → {exc}", file=sys.stderr)
            fails.append((p, str(exc)))
            failed += 1

    print()
    print(f"Done. OK={ok}  SKIP={skipped}  FAIL={failed}  "
          f"Total on disk: {total_bytes / 1024 / 1024:.1f} MB")
    if fails:
        print()
        print("Failed downloads (will retry on next run):")
        for p, msg in fails:
            print(f"  - {p.local_path}: {msg}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
