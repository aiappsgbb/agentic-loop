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

## Skills catalog

The `/skills` page (`src/pages/SkillsCatalog.tsx`) lists skills for two phases, each sourced from a reference catalog in the `agentic-loop` skill:

- **Build skills** mirror `skills/agentic-loop/references/build-skills-catalog.md` and live in `BUILD_SKILLS` in `src/data/skills.ts`. These are skills you install to help *build* the app.
- **Run skills** mirror `skills/agentic-loop/references/run-skills-catalog.md` and live in `RUN_SKILLS` in `src/data/skills.ts`. These are skills the *agent itself runs* at execution time; reuse them when explicitly named instead of regenerating.

To add or change a skill, edit the matching markdown catalog **and** the corresponding array in `src/data/skills.ts` so the page stays in sync (`id` must match the skill folder name; `repo` is `owner/repo`, or `''` for run skills with no published repo).

The rules that decide **which skills to build vs. run** must stay synced with these catalogs: build-skill selection (the `agentic-loop` "Install suggested skills" matching) is governed by `build-skills-catalog.md`, and run-skill reuse (the "Reuse named run skills" rule) is governed by `run-skills-catalog.md`. When you change a skill's phase, trigger, or repo, update the matching catalog so the `BUILD_SKILLS` / `RUN_SKILLS` arrays, the playbook `buildSkills` / `runSkills` fields, and the agent's selection logic all agree.

## Linking scenarios &harr; playbooks

Matching is by scenario `tags` &harr; a playbook's combined `patterns` + `capabilities` + `building_blocks` (see `playbookMatchTags` in `src/data/links.ts`): a playbook shows for a scenario when any of those values intersect the scenario `tags`, or when `patterns` is `["*"]`. Keep the strings consistent across both files.

## Build

- Editing existing `.md`/`.json`: `npm run dev` hot-reloads — just save.
- For production: `npm run build`, then deploy `dist/`.

