---
name: check-ui
description: >-
  Audits Shredmap UI for layout, stacking, and accessibility. Use when the user
  asks to check the UI, review overlays vs fixed chrome, find obstructed
  controls, validate z-index layering, or audit the map/header/panels. Also use
  for generic UX/accessibility passes on this codebase.
---

# Check UI (Shredmap)

## When to apply

Use this skill for **visual/layout bugs** (controls hidden behind fixed headers, panels, or map chrome), **stacking context** issues, and **accessibility** spot checks—not only when the user says the exact phrase “check the UI”.

## Workflow

1. **Locate the surface** — Identify routes and components (e.g. `components/map/*`, `components/marketing/site-header.tsx`, `(app)` layouts). Read the JSX/CSS for the reported area before changing anything.

2. **Stacking and hit targets (common bug source)** — Fixed or sticky chrome (`header`, floating buttons) often uses `z-20` or similar. Overlays that must be closable (side panels, drawers, modals) must sit **above** that layer (`z-30+` in this project unless a deliberate design says otherwise). Verify:
   - Close/dismiss controls are not under higher `z-index` siblings.
   - `pointer-events-none` on wrappers does not accidentally block children (children should use `pointer-events-auto` where needed).

3. **Web Interface Guidelines** — For a full best-practices pass, follow [`.agents/skills/web-design-guidelines/SKILL.md`](../../../.agents/skills/web-design-guidelines/SKILL.md): fetch current rules from the URL in that skill and map findings to `file:line` in our components.

4. **Accessibility quick pass** — Interactive controls need visible focus, sufficient contrast on primary actions, and `aria-label` (or equivalent text) on icon-only buttons (e.g. panel close).

5. **If behavior depends on viewport** — Check both narrow and `md+` breakpoints; map layout often splits mobile full-screen vs desktop side panel.

## Project-specific note

The homepage map uses **fixed top chrome** (`MapChrome`) and a **desktop side panel** for park details. Any panel that aligns with the top-right of the viewport must use a **higher z-index than the header** so the close control stays clickable.
