# Shredmap documentation

| Document | Purpose |
|----------|---------|
| [**Shredmap wiki index**](./shredmap/index.md) | Feature-based docs with drill-down pages. **Start here** for product and feature work. |
| [**Shredmap compatibility entry point**](./shredmap.md) | Legacy landing page that points to the wiki index. |
| [**Boilerplate guide**](./boilerplate.md) | How the inherited Next.js starter is organized (route groups, auth patterns, catalog demo, DB migrations). Use when changing shared infrastructure. |

## Wiki layout

- `docs/shredmap/index.md` - central index and navigation
- `docs/shredmap/features/*.md` - feature-level docs (primary place to document feature changes)
- `docs/shredmap/reference/*.md` - deeper technical reference pages

`AGENTS.md` at the repo root stays the **concise agent brief** (vision + guardrails). The Shredmap wiki is the **longer reference** for humans and ongoing feature documentation.
