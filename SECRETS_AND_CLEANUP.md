# Secrets & Cleanup

What "secrets" this project depends on, and how to nuke everything if you want to walk away from it.

---

## 1. Inventory of secrets / credentials

Despite the security theatre on most web apps, this project has **almost nothing genuinely secret**. Here's the complete list with the actual risk of each.

### a) Google Sheet — published-to-web ID

**Value**: `2PACX-1vRdvz-leeAP8t43mtpaU9KY2PIJOc1XWCW32oMkhiMXGRSrlYWMItGi5Oz0iR91j4dgvWDP3Bl9cu1E`

**Location in repo**: `src/lib/sheets.ts` → `SHEET_PUBLISHED_ID`

**Risk if leaked**: zero. This ID exists *to be public* — that's the whole point of "Publish to web". Anyone with the ID can read your published tabs. They *cannot* write, cannot see your other Drive files, cannot edit the underlying Sheet. The "Publish to web" stream is a one-way read-only mirror.

**Rotation**: if you ever want a new ID:
1. In the Sheet → *File → Share → Publish to web → Stop publishing*.
2. *Publish to web* again — you get a new `2PACX-1v...` token.
3. Paste it into `src/lib/sheets.ts` → commit → push.

---

### b) Apps Script web app `/exec` URL

**Value**: `https://script.google.com/macros/s/AKfycbxW2hZK9_r7yRpuTKHFvzGJtSm4y0fbhDDQic33CYmHDWSfuVDCJoTCKnKsgu_Ig7V00Q/exec`

**Location in repo**: `src/lib/sync.ts` → `APPS_SCRIPT_URL`

**Risk if leaked**: low but non-zero. Anyone who knows this URL can:
- **READ**: the page-number of any PDF you've opened (e.g. `?key=material-cost` → `{"page": 42}`). Tells them you're on page 42 of "material cost". Mildly creepy but not sensitive.
- **WRITE**: POST `{key, page}` to any key. Could spam writes to the hidden `ReadingState` tab, or overwrite your saved positions. Worst case: your "resume reading" feature gives wrong page numbers until you fix it.

**They CANNOT**:
- Touch any other tab in your Sheet
- See your Drive
- Run any other Apps Script
- Access your email, calendar, or anything else
- Spend money (Apps Script free tier handles ~20K calls/day per user; way more than personal use)

The URL itself is a ~50-char random token — security through obscurity is reasonable for a personal-use project. The URL stays inside: your browser, this VPS, your GitHub repo (public, so technically scrapeable), and your Google account.

**Rotation** (if you want a clean URL):
1. In the Sheet → *Extensions → Apps Script* → *Deploy → Manage deployments*.
2. Click the trash icon next to the existing deployment → confirm.
3. *Deploy → New deployment* (gear → Web app → same settings as before).
4. Copy the new `/exec` URL → paste into `src/lib/sync.ts` → commit → push.

---

### c) GitHub SSH key

**Location on this VPS**: `/home/coder/.ssh/id_ed25519` (private) + `.pub` (public)

This is the SSH key used to push to GitHub from this VPS. It's NOT in the repo (private keys never go in repos). It's only on the VPS filesystem.

**If the VPS is compromised**: the attacker can push to any repo this key has access to. Mitigation:
1. Log into github.com → *Settings → SSH and GPG keys*.
2. Find the key labeled with this VPS's hostname → click *Delete*.
3. Then generate a new key on the VPS and re-add.

---

### d) That's it

Notable things that **are NOT secrets**:
- The GitHub repo URL (`spacechase26/ca-inter`)
- The Pages URL (`spacechase26.github.io/ca-inter`)
- Your Google account email (used only as Apps Script "Execute as")
- The Sheet's editable URL (`https://docs.google.com/spreadsheets/d/1PkTJ-.../edit`) — only people you *Share* it with can edit; the public ID is different from the editable ID
- The xlsx file contents (already on GitHub as `snapshots/*.json`)

---

## 2. Why this is safe to commit to a public repo

Both the Sheet ID and Apps Script URL are committed in `src/lib/sheets.ts` and `src/lib/sync.ts`. The Astro build also bundles them into the JS that ships to every visitor's browser. There is no way to "hide" them from end users while still letting the website call those endpoints — anything the browser knows, the user knows.

For a **personal-use** project where the worst-case leak is "someone overwrites my PDF page-numbers", that trade-off is correct. For a multi-user product, you'd add server-side auth and put real secrets behind an API gateway.

---

## 3. Full uninstall — leaving no trace

If you want to abandon the project entirely, walk through these in order. Each is independent — you can stop after any step.

### Step 1 — Stop the dev server on this VPS

```sh
# Find any running astro dev process
ps aux | grep "astro dev" | grep -v grep
# Kill it
kill <PID>
```

### Step 2 — Delete the local project on this VPS

```sh
rm -rf /home/coder/ca-inter
```

This removes the source, node_modules, and the git working tree. The git history is preserved on GitHub until Step 4.

The original xlsx at `/home/coder/CA_INTER_G2_Planner_v1.xlsx` is **NOT** part of this project — leave or delete it as you wish.

### Step 3 — Take the live site down (without deleting the repo)

If you just want to disable Pages but keep the code:
1. Go to https://github.com/spacechase26/ca-inter/settings/pages
2. Under *Source*, click the dropdown → select *None*
3. The site at `spacechase26.github.io/ca-inter/` will 404 within minutes

### Step 4 — Delete the GitHub repo

1. Go to https://github.com/spacechase26/ca-inter/settings
2. Scroll to the bottom *Danger Zone* → click *Delete this repository*
3. Confirm by typing the repo name

This permanently removes the code, history, all Action runs, and the Pages site.

### Step 5 — Stop the Apps Script web app

1. Open your Google Sheet
2. *Extensions → Apps Script*
3. *Deploy → Manage deployments*
4. Click the trash icon next to the active deployment → *Archive*

The `/exec` URL stops responding. The hidden `ReadingState` tab data remains in the Sheet (you can manually delete the tab if you want).

### Step 6 — Stop publishing the Sheet to web

1. Open the Sheet
2. *File → Share → Publish to web*
3. Click *Stop publishing*

The published CSV URLs stop responding. Anyone who had the published URL now gets a 404.

### Step 7 — Delete the Sheet itself

1. Drive → right-click your "CA INTER Study Planner" Sheet → *Move to trash*
2. Empty trash (or wait 30 days for auto-purge)

### Step 8 — Revoke the Apps Script authorization

The Apps Script you deployed asked for permission to read/write the Sheet. To revoke:
1. https://myaccount.google.com/permissions
2. Find the entry for "CA Inter Sync" (or whatever you named the Apps Script project)
3. Click it → *Remove Access*

### Step 9 — Optional: rotate the VPS SSH key

If you want this VPS to lose write access to your GitHub:
1. https://github.com/settings/keys
2. Find and *Delete* the key labeled with this VPS's hostname

---

## 4. Partial cleanup — keep website, kill PDF sync

If you decide cross-device PDF sync isn't worth it but want to keep the rest:
1. Steps 5 + 8 above (kill Apps Script + revoke its auth).
2. Open `src/lib/sync.ts` → empty the `APPS_SCRIPT_URL = ""`.
3. `git commit -am "Remove Apps Script sync" && git push`.

The PDF resume feature then falls back to localStorage (per-device only). Everything else keeps working.

---

## 5. Partial cleanup — go offline / disconnect from Google entirely

If you want the site to keep working but stop reading from your live Sheet:
1. Open `src/lib/sheets.ts` → empty the `SHEET_PUBLISHED_ID = ""`.
2. `git commit -am "Use snapshot only" && git push`.

The site will fall back to the bundled `src/data/snapshots/*.json`. You can edit those JSON files by hand if you want — the site reads them on every page load. No more live Sheet dependency.

---

## 6. Checklist — am I fully clean?

- [ ] Local dir `/home/coder/ca-inter` deleted
- [ ] GitHub repo `spacechase26/ca-inter` deleted
- [ ] Apps Script deployment archived
- [ ] Sheet stopped publishing to web
- [ ] Sheet itself deleted (or kept as an offline workbook)
- [ ] Apps Script permission revoked from myaccount.google.com/permissions
- [ ] (Optional) VPS SSH key removed from GitHub

After all checked, the project leaves no infrastructure or external dependencies running.
