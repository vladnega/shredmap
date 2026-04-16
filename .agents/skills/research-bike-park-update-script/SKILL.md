---
name: research-bike-park-update-script
description: Researches one or multiple bike parks and produces API-ready payloads plus browser-console scripts (POST create and/or PATCH) for Shredmap. Use when the user asks to populate bike park data from public sources, validate official assets/links, or generate scripts to create or update `/api/bike-parks` and `/api/bike-parks/:id`.
---

# Research Bike Park Update Script

## Purpose

Use this skill to:

1. Research accurate, current bike park data from authoritative sources.
2. Map findings to Shredmap bike park API fields.
3. Generate copy-paste scripts the user can run while authenticated in the app.

This skill is optimized for:

- A single bike park create or update.
- Batch creates/updates for a list of bike parks.

## Required workflow

Follow this checklist exactly:

```text
Task Progress:
- [ ] Step 1: Decide CREATE vs PATCH per park (row exists or not)
- [ ] Step 2: Collect sources and classify trust level
- [ ] Step 3: Build normalized field mapping
- [ ] Step 4: Validate URLs/assets and opening hours
- [ ] Step 5: Generate POST and/or PATCH script(s)
- [ ] Step 6: Ask for explicit confirmation before execution
- [ ] Step 7: Verify saved record(s) with GET
```

## Step 1: Identify targets — CREATE vs PATCH

- **List public markers:** `GET /api/bike-parks` returns `{ parks }` with `id`, `name`, coordinates, etc. Use this to see what already exists **in the user’s database** (not only `data/bike-parks.seed.json`).
- **Seed file** can hint default UUIDs for a fresh clone, but **production or partially seeded DBs may be missing rows** — always treat “no matching `id`” as a **CREATE**.
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
- `website`
- `buyTicketUrl`
- `payment` (`paid` or `free`)
- `logoUrl`
- `pinLogoUrl`
- `openingHours` (record of day -> text; see **Opening hours rules** below)
- `facilities` (must be allowed slugs only)

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
- Validate logo/pin URLs with an HTTP status check before recommending.
- **Opening hours rules (mandatory):**
  - Use **only days when the venue is open** for that schedule. **Do not** add keys for closed days and **do not** use values like `Closed`, `N/A`, or `—`.
  - Use **plain hours only** in each string (e.g. `09:30-16:00`, `10:00-18:00`). **Do not** embed seasonal caveats, “verify on site”, “winter/summer”, or date ranges inside `openingHours` values.
  - If hours vary by season and cannot be expressed as one simple string without caveats, **omit `openingHours`** for that park (or omit the field in PATCH) and mention the complexity in **Sources / assumptions** only — do not push seasonal prose into the JSON.
- Normalize times to concise 24h-style ranges where possible.
- If opening hours conflict across sources, prefer official booking/current operational channel and mention the conflict in prose (still keep `openingHours` values simple if you include them).
- Keep unknown fields unchanged (PATCH) rather than guessing.

## Step 5: Generate scripts

Default output is a browser-console script that uses the user’s authenticated session cookie.

Admin/staff auth is required for `POST` and `PATCH`.

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
    // optional: website, buyTicketUrl, payment, logoUrl, pinLogoUrl, facilities, trailDifficultyCounts, openingHours
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

1. Proposed mapped payload(s), labeled **CREATE** vs **PATCH** per park.
2. Source links used.
3. Any assumptions/conflicts.

Then ask for explicit confirmation like: "Confirm and I will apply this update now."

## Step 7: Post-update verification

After write execution, verify each park with:

- `GET /api/bike-parks/:id`

Return a concise diff-style summary:

- Created vs updated rows (and new ids from POST).
- Updated fields.
- Unchanged fields intentionally left alone (PATCH only).
- Any failed writes with status/error.

## Output format

When replying, structure output as:

1. **Proposed data** (field-value list), with **CREATE** or **PATCH** per park.
2. **Sources** (official first).
3. **Script** (POST and/or PATCH; single or batch).
4. **Verification plan/result**.

Keep language concise and avoid speculative values.
