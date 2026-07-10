# Citadel & Threadlight Playbooks — Design

**Date:** 2026-07-10
**Repo:** `aiappsgbb/agentic-loop-site` (unified skills + website, served on GitHub Pages)
**Status:** Approved (verbal) — implementing

## Problem

The site's `/playbooks` surface shows scenario-oriented, step-by-step decks. Two high-value
motions are missing:

1. **Citadel** — the production governance landing zone (Layer-1 AI Gateway hub + per-team
   access-contract spokes). Sellers/SEs need a concrete, do-it-now deployment deck.
2. **Threadlight** — the opinionated "one paragraph → governed, production-ready Foundry agent
   in a single session" pipeline. Needs an orientation deck that frames the arc and points
   deep into the 17-skill family, without re-teaching each skill.

## Constraints

- **No skills-catalog edits.** Do not touch `src/data/skills.ts` or the reference
  `build-skills-catalog.md`. Citadel/Threadlight skill ids render as **plain pills**; depth
  comes from the deck body and outbound links (GitHub source + Threadlight GH Pages).
- **Reuse existing content.** Citadel from `aiappsgbb/awesome-gbb`
  (`citadel-hub-deploy`, `citadel-spoke-onboarding`); Threadlight from
  `aiappsgbb/threadlight-skills` (`THREADLIGHT.md`, README, GH Pages narrative).
- **Match existing taxonomy** (patterns / building_blocks / capabilities strings) so
  scenario↔playbook matching (`playbookMatchTags`) keeps working.

## Altitude (decided with user)

- **Citadel = full step-by-step.** Modeled on `enterprise-knowledge-grounding` density:
  real commands, verification, callouts.
- **Threadlight = orientation only.** Frame the arc + loop, name the 17 skills grouped, link out.

## Deliverables

| Artifact | Purpose |
|---|---|
| `playbooks/citadel-governance-hub/README.md` | Full deck: Intro → Build the hub → Onboard a spoke → Scale |
| `playbooks/threadlight-pipeline/README.md` | Orientation deck: Intro → The chain → The 17 skills → Go deeper |
| `src/data/playbooks.json` (+2) | Card metadata (slug, icon, level, summary, use_when, patterns, buildSkills, runSkills) |
| `src/pages/Playbooks.tsx` | Add `Castle` + `Waypoints` to ICONS map |

## Playbook metadata

**citadel-governance-hub** — icon `Castle`, level `Advanced`, patterns `["Governance"]`,
capabilities `["Knowledge"]`(n/a — omit), building_blocks `["AI Gateway","Identity & Access","Observability"]`,
buildSkills `["citadel-hub-deploy","citadel-spoke-onboarding","azure-aigateway","entra-agent-id","azure-rbac","appinsights-instrumentation"]`,
runSkills `["incident-postmortem"]`.

**threadlight-pipeline** — icon `Waypoints`, level `Advanced`, patterns `["*"]` (matches all
scenarios — it is a meta-pipeline), building_blocks `["Observability","AI Gateway","Identity & Access"]`,
buildSkills = 17 `threadlight-*` ids, runSkills `[]`.

## Rendering contract (from `PlaybookPage.tsx`)

`#` H1 title (not a slide) · `##` H2 chapter (progress rail) · `###` H3 = one slide ·
non-`###` prose dropped · first slide must be `###` · `---` stripped ·
`> Note:/Tip:/Warning:/Important:` callouts · ```mermaid``` diagrams · images `./images/<f>`.

## Out of scope

- No new `/skills/:id` detail pages (no catalog edits).
- No scenario entries (`scenarios.json` untouched) — decks are discoverable via `/playbooks`
  and, for Threadlight, via the `["*"]` wildcard match on every scenario.
- No changes to Vite base path / routing (automatic).
