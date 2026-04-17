---
name: research-bike-park-update-script
description: Researches bike parks and delivers a runnable browser script (POST/PATCH against `/api/bike-parks`) plus research notes. Covers trail difficulty counts, logos, and opening hours. Does not edit `data/bike-parks.seed.json` unless the user explicitly requests seed changes.
---

# Research Bike Park Update Script

## Purpose

Use this skill to:

1. Research accurate, current bike park data from authoritative sources.
2. Map findings to Shredmap bike park API fields.
3. **Deliver a `.js` file** the user runs in the **browser DevTools console** on their Shredmap deployment (staff session), not edits to `data/bike-parks.seed.json`.

**Default deliverable:** a checked-in or pasted script under **`.agents/skills/research-bike-park-update-script/browser-scripts/`** (name it after the batch, e.g. `upsert-woburn-chicksands-aston-epping.js`). The script should use relative `/api/bike-parks` URLs, `credentials: 'include'`, **POST** for new rows and **PATCH** for existing (resolve ids via `GET /api/bike-parks` + name match unless the user supplies UUIDs).

**Do not** add or change rows in **`data/bike-parks.seed.json`** for this workflow unless the user **explicitly** asks to update the seed file.

This skill is optimized for:

- A single bike park create or update.
- Batch creates/updates for a list of bike parks.

## Required workflow

Follow this checklist exactly:

```text
Task Progress:
- [ ] Step 1: Decide CREATE vs PATCH per park (row exists or not)
- [ ] Step 2: Collect sources and classify trust level
- [ ] Step 3: Build normalized field mapping (including logo + pin assets)
- [ ] Step 3b: **Trail difficulty inventory** — counts per band + mapping notes (see below); never skip this step
- [ ] Step 4: Validate URLs/assets and opening hours
- [ ] Step 5: Generate POST and/or PATCH script(s)
- [ ] Step 6: Ask for explicit confirmation before execution
- [ ] Step 7: Verify saved record(s) with GET
```

## Step 1: Identify targets — CREATE vs PATCH

- **List public markers:** `GET /api/bike-parks` returns `{ parks }` with `id`, `name`, coordinates, etc. Use this to see what already exists **in the user’s database**. Match by **exact `name`** in the browser script unless the user provides ids.
- The **seed file** is only relevant when the user wants local seed changes; for normal research tasks, **ignore** `data/bike-parks.seed.json` and drive **POST/PATCH** only.
- **PATCH** when a park **already exists**: `PATCH /api/bike-parks/:id` with at least one allowed field.
- **CREATE** when no row exists: `POST /api/bike-parks` with a full `bikeParkCreateBodySchema` payload (`name`, `description`, `latitude`, `longitude` required; other fields optional with defaults).
- Prefer exact name matches when correlating research to a row.
- If ambiguous, ask the user to confirm the target row before generating scripts.

## Step 2: Source collection rules

Prioritize sources in this order:

1. Official bike park website.
2. Official booking page owned by the park.
3. Official social channels (Facebook/Instagram).
4. Local authority/tourism listings.
5. Community aggregators (use as secondary confirmation only).

Do not treat third-party aggregate logo files as official branding assets unless no official asset exists and the user approves fallback usage.

## Step 3: Field mapping (Shredmap)

Map research into these API fields where available:

- `name`
- `description` (plain text; API escapes to HTML)
- `latitude`, `longitude`
- **`trailDifficultyCounts`** — **mandatory research output** for every park (see **Trail difficulty counts** below)
- `website`
- `buyTicketUrl`
- `payment` (`paid` or `free`)
- `logoUrl`
- `pinLogoUrl`
- `openingHours` (record of day -> text; see **Opening hours rules** below)
- `facilities` (must be allowed slugs only)

### Trail difficulty counts (`trailDifficultyCounts`) — mandatory

The map detail UI shows a **per-band trail count** when `trailDifficultyCounts` is present. Treat this as a **first-class field** alongside logos: **always determine what trail types exist, how many in each band, and populate `trailDifficultyCounts`** (or document why every band is zero).

**Schema (Shredmap):** `green`, `blue`, `red`, `black`, `doubleBlack` — each a **non-negative integer**. Sum = total trails/features the operator counts in those bands for this listing (not guestimated from vibe).

**What to research**

1. **Which grades the venue uses** (e.g. UK green/blue/red/black/**orange**, North American green–double black, etc.).
2. **How many trails (or distinct named lines/features) fall in each grade**, using the same definition the operator uses on their trail map or trail list.
3. Whether the venue is **not** a graded MTB facility (e.g. only shared bridleways): then set **all counts to `0`** and explain in `description` — do not invent grades.

**Source priority**

1. Official trail map, trail list PDF, or “Trails” pages on the operator site (counts or enumerable list).
2. Official booking or trail-status pages that list trails by grade.
3. **Secondary (clearly label in Sources / assumptions):** Trailforks, MTB project wikis, or national trail databases — use only to fill gaps or cross-check, not as the sole source when an official map exists.

**Mapping other systems → Shredmap bands**

- **UK “orange” / “orange severe” / extra orange markers** used for pro or extreme bike-park lines → map to **`doubleBlack`** (closest match to “pro / double-black” terrain in this app).
- **“Black – severe”** on Forestry England–style pages → **`black`** unless the operator explicitly treats it as a tier above black → then **`doubleBlack`**.
- If a trail is labelled **blue/red** (split grade), assign **one** band using the **harder** grade unless the operator publishes a separate count for each half.

**Totals and consistency**

- If the operator publishes a **total trail count** and a **per-grade breakdown**, the **sum of `trailDifficultyCounts` must match** that total (or you must explain a documented exception, e.g. “four pump tracks counted separately”).
- If only a **total** and **grade labels** are published but **not** per-grade numbers, derive counts by **enumerating named trails/features** from official pages — then state **“derived from official trail names on …”** in Sources / assumptions.
- If grades are known but **counts cannot be justified**, set bands to **`0`** and put the **qualitative** grade info in **`description`** — do not fabricate numbers.

**Closures and non-parks**

- **Bike park closed / trails removed / rebuild not yet rideable:** set counts to **`0`** (or last officially published counts only if the user explicitly wants historical data preserved — say so).

### Logo and pin images (mandatory when research allows)

Treat **`logoUrl`** and **`pinLogoUrl`** as **first-class fields**: always try to supply both for every park. They materially affect the map and detail UI.

- **Source priority:** Use **official** assets only — same hierarchy as **Step 2** (site header, `schema.org` / JSON-LD `logo`, `og:image` only when it is clearly the brand mark, favicon or app icon from the **same** domain, or documented media on the operator CDN). Do not use third-party scraper homepages or Wikimedia unless the user explicitly approves a fallback.
- **`logoUrl`:** Full wordmark or lockup suitable for the **detail panel** (wider asset is fine).
- **`pinLogoUrl`:** **Square or compact** mark where possible — official **favicon**, **apple-touch-icon**, or a **small** CDN variant of the same artwork. If only one official asset exists, the same URL may be used for both fields; state that in assumptions.
- **Formats:** `https` URLs to **PNG**, **JPEG**, **SVG**, **WebP**, etc. are acceptable if the app and map loader support them; SVG is fine when it is the venue’s own hosted file.
- **Contrast:** Note in prose if the official logo is a **light-on-transparent** wordmark (e.g. designed for dark headers) so the user can override if the UI background differs.
- **Discovery tips:** Inspect homepage HTML, `/images/`, `wp-content/uploads/`, Wix `static.wixstatic.com` media URLs tied to the site, and **Yoast** / **Organization** structured data. If the main site is behind a bot wall, use a **read-only** mirror or fetch path that still reflects the operator’s own asset URLs (and cite that in Sources).

Allowed `facilities` slugs:

- `bike_rental`
- `bike_mechanic`
- `food_drink`
- `toilets`
- `showers`
- `bike_wash`
- `first_aid`
- `coaching`
- `parking`
- `uplift_chair`
- `uplift_gondola`
- `uplift_shuttle`
- `ebike_allowed`
- `accommodation`
- `shop`

## Step 4: Validation rules

- Validate all URLs as absolute `http` or `https`.
- **`trailDifficultyCounts`:** Every value must be a **non-negative integer**; all five keys must be present when the field is included. Prefer **sums that match** the operator’s published total trail count when one exists; if not, explain in Sources / assumptions.
- **Logo and pin URLs:** Before recommending, verify each **`logoUrl`** and **`pinLogoUrl`** with an **HTTP request** (e.g. `HEAD` or `GET`) that returns **success** (`2xx`). If automated checks fail due to bot protection but the URL is visibly correct on the official site (same path the browser loads), say so and still list the URL with that caveat.
- **Opening hours rules (mandatory):**
  - Use **only days when the venue is open** for that schedule. **Do not** add keys for closed days and **do not** use values like `Closed`, `N/A`, or `—`.
  - Use **plain hours only** in each string (e.g. `09:30-16:00`, `10:00-18:00`). **Do not** embed seasonal caveats, “verify on site”, “winter/summer”, or date ranges inside `openingHours` values.
  - If hours vary by season and cannot be expressed as one simple string without caveats, **omit `openingHours`** for that park (or omit the field in PATCH) and mention the complexity in **Sources / assumptions** only — do not push seasonal prose into the JSON.
- Normalize times to concise 24h-style ranges where possible.
- If opening hours conflict across sources, prefer official booking/current operational channel and mention the conflict in prose (still keep `openingHours` values simple if you include them).
- Keep unknown fields unchanged (PATCH) rather than guessing.

## Step 5: Generate the browser script (primary output)

**Produce a runnable JavaScript file** (see **Purpose** above) that:

- Calls **`GET /api/bike-parks`** to decide **CREATE vs PATCH** (match `name`, or use ids the user gave you).
- Uses **`fetch(..., { credentials: 'include' })`** so the staff session cookie is sent.
- Sends **`POST /api/bike-parks`** with `bikeParkCreateBodySchema` fields (plain-text `description`; API wraps HTML). Remember **`POST` does not set `payment`** — follow with **`PATCH /api/bike-parks/:id`** `{ payment: 'paid' | 'free' }` when needed.
- Sends **`PATCH /api/bike-parks/:id`** with the full set of fields you want to store (PATCH merges; include `trailDifficultyCounts`, logos, `openingHours`, etc.).

Admin/staff auth is required for `POST` and `PATCH`.

Also paste the same script into the chat (or summarize where the file lives) so the user can copy it without hunting the repo.

### Single park — CREATE (`POST`)

Use when the park **does not** exist in `GET /api/bike-parks`.

```js
await fetch('/api/bike-parks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '…',
    description: '…',
    latitude: 0,
    longitude: 0,
    // optional: website, buyTicketUrl, payment, logoUrl, pinLogoUrl, facilities, trailDifficultyCounts (required in research output), openingHours
  }),
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
```

### Single park — UPDATE (`PATCH`)

Use when the park **already** exists.

```js
await fetch('/api/bike-parks/<PARK_ID>', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // include only researched fields you are confident in
  }),
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
```

### Multi-park batch (creates and updates)

Use separate arrays or a clear split: **POST each new row first**, capture returned `id`, then **PATCH** existing ids.

```js
const creates = [
  { body: { name: '…', description: '…', latitude: 0, longitude: 0 /* … */ } },
];

const patches = [
  { id: '<EXISTING_UUID>', body: { /* … */ } },
];

const results = [];

for (const item of creates) {
  const res = await fetch('/api/bike-parks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item.body),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  results.push({ op: 'POST', status: res.status, body });
}

for (const item of patches) {
  const res = await fetch(`/api/bike-parks/${item.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item.body),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  results.push({ op: 'PATCH', id: item.id, status: res.status, body });
}

results;
```

## Step 6: Confirmation gate (mandatory)

Before any write action by the agent, present:

1. Proposed mapped payload(s), labeled **CREATE** vs **PATCH** per park, including **`trailDifficultyCounts`** (or explicit **all-zero** rationale), **`logoUrl` / `pinLogoUrl`** when available.
2. Source links used (including where branding assets were taken from).
3. Any assumptions/conflicts (e.g. single asset reused for both fields, light-on-dark logo, bot-blocked HEAD check).

Then ask for explicit confirmation like: "Confirm and I will add/update the browser script now." (The user runs the script locally; the agent does not run it against production unless the user asks.)

## Step 7: Post-update verification

After write execution, verify each park with:

- `GET /api/bike-parks/:id`

Return a concise diff-style summary:

- Created vs updated rows (and new ids from POST).
- Updated fields (including **`trailDifficultyCounts`**, **`logoUrl` / `pinLogoUrl`** when patched).
- Unchanged fields intentionally left alone (PATCH only).
- Any failed writes with status/error.

## Output format

When replying, structure output as:

1. **Proposed data** (field-value list), with **CREATE** or **PATCH** per park. Include **`trailDifficultyCounts`** (per-band counts and how they were derived). Include **`logoUrl`** and **`pinLogoUrl`** for each park when you have verified or defensibly official URLs; if genuinely unavailable after checking official sources, say **omitted** and why.
2. **Sources** (official first), including **direct links to the pages** where logo/pin assets appear.
3. **Browser script** — the full contents (or path under `.agents/skills/research-bike-park-update-script/browser-scripts/`) of the **`.js`** file to paste into DevTools. Do **not** point the user at `data/bike-parks.seed.json` unless they asked for seed changes.
4. **Verification plan/result** — after they run the script: `GET /api/bike-parks/:id` or reload the map.

Keep language concise and avoid speculative values.
