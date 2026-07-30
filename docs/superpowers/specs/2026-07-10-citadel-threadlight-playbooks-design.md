# Citadel & Threadlight Playbooks — Design

**Date:** 2026-07-10
**Repo:** `aiappsgbb/agentic-loop-site` (unified skills + website, served on GitHub Pages)
**Status:** Implemented — rewritten after live-review rejection; adversarially reviewed and verified

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

## Rethink (after live-review rejection)

The first implementation shipped as PR #9 and was rejected on live review: Citadel "pitched
the skills then dropped to scripts, with **no link to the Agentic Loop**"; Threadlight "landed
nothing" versus its rich public site. Both decks were fully rewritten with new framing:

- **Citadel is now concept-first.** It opens from the *need* — "a demo is not a production
  system; every use case must earn its way to production" — then explicitly bridges from the
  Agentic Loop (a loop-built agent becomes a governed **spoke**). New spine:
  **Why govern → Build the hub → Onboard a spoke → Scale & compose** (4 chapters / 20 slides).
  It teaches the core concept the user demanded: **platform governance is not agent
  governance**, and the **AI Gateway** pattern in front of Foundry. Technical bones (deploy
  profiles, Access Contract, keyless Option-B consumption, JWT) are kept but *framed*.
- **Threadlight is now story-first**, mirroring the public site's punch. New spine:
  **The pitch → The proof → The pipeline → Ship it for real** (4 chapters / 14 slides).
  It leads with the hero promise ("You describe it. Copilot builds it. Foundry runs & governs
  it."), foregrounds the **six-stage reel** (verbatim: *Brief → Design → Local → Deploy →
  Govern → Scorecard*) and the case-study **receipts** (14 stages, 13 PASS + 1 conditional,
  deprecated model 403 at the gateway, 92/100), then explains the contracts and the roster.
- **Both decks cross-reference the bridge:** Citadel secures the landing zone (platform
  governance); Threadlight proves the agent that runs in it (agent governance). Each links to
  the other and to the `agentic-loop` skill + `lean-spec2cloud`.

Adversarial self-review (rubber-duck) verdict: satisfies the rejection. Top fixes applied:
Citadel keyless-vs-JWT contradiction resolved; Threadlight verbatim reel phrase added, the
"17 skills" list reframed as a by-role reference roster, `threadlight-customize` fork wording
disambiguated, case-study source linked. Verified live on the dev server (both decks: chapters
render, all mermaid diagrams parse, callouts styled, no orphaned prose; cards show refined
summaries).

## Deliverables

| Artifact | Purpose |
|---|---|
| `playbooks/citadel-governance-hub/README.md` | Concept-first deck: Why govern → Build the hub → Onboard a spoke → Scale & compose |
| `playbooks/threadlight-pipeline/README.md` | Story-first deck: The pitch → The proof → The pipeline → Ship it for real |
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
