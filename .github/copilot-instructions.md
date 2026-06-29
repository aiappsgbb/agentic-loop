# Copilot Instructions

## Playbooks

A playbook = **metadata entry** + **markdown content**.

1. **Metadata** — add an entry to `src/data/playbooks.json`:
   - `slug` (must match the folder name in step 2), `name`, `icon` (lucide icon name), `level`, `summary`, `use_when`, `patterns` (use `["*"]` to match all scenarios), `capabilities`, `building_blocks`, `buildSkills`.
2. **Content** — create `playbooks/<slug>/README.md` (body rendered on the page). Put images in `playbooks/<slug>/images/` and reference them as `./images/<file>` (paths are auto-rewritten).

Routing/data flow is automatic: `/playbooks` lists cards, `/playbooks/:slug` renders the README. Loaded via `import.meta.glob` in `src/pages/PlaybookPage.tsx` and `src/data/links.ts`.

## Scenarios

Scenarios are metadata-only. Add an entry to `src/data/scenarios.json`:
- `id` (used in the `/scenarios/:id` route), `name`, `industry`, `description`, `image` (`images/<file>`), `tags`, optional `link`.

## Linking scenarios &harr; playbooks

Matching is by scenario `tags` &harr; a playbook's combined `patterns` + `capabilities` + `building_blocks` (see `playbookMatchTags` in `src/data/links.ts`): a playbook shows for a scenario when any of those values intersect the scenario `tags`, or when `patterns` is `["*"]`. Keep the strings consistent across both files.

## Build

- Editing existing `.md`/`.json`: `npm run dev` hot-reloads — just save.
- For production: `npm run build`, then deploy `dist/`.

