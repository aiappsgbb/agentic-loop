# Information Architecture — what to use when

This document is the source of truth for how the Agentic Loop site is organized.
Every page's positioning copy and every cross-link derives from the model below.

## The problem it solves

The site has several surfaces that can feel overlapping. A first-time visitor must be
able to answer **"what do I use, and when?"** in seconds. This IA encodes that answer.

## The model — two axes plus a mode

| Surface | One-line job | Axis / mode |
| --- | --- | --- |
| **Home prompt → Make it real** | Build a novel idea from a blank prompt | Greenfield (from scratch) |
| **Kratos** | Operate a live, prebuilt reference agent — no build required | Experience (try it now) |
| **Scenarios** | Start from a proven industry **outcome** | WHAT (vertical) |
| **Playbooks** | Master a reusable **technique** | HOW (horizontal) |
| **Skills catalog** | Look up any Build/Run capability | Reference |
| **Concepts / Platform** | Understand the operating model + Azure substrate | Understand |

Two key relationships:

- **A Scenario is assembled FROM Playbooks.** Recipes (playbooks, horizontal techniques)
  combine into finished dishes (scenarios, vertical outcomes). They are orthogonal, not
  competing — every scenario page lists the playbooks it's built from, and every playbook
  lists the scenarios that use it.
- **Kratos vs Scenarios is a mode split.** Kratos = *experience it live* (prebuilt,
  no build). Scenarios = *build it yourself* (a blueprint you fork). Kratos can host
  scenarios as personas, so "try live" precedes "build from blueprint."

## The spine

```
UNDERSTAND  →  EXPERIENCE  →  CHOOSE A START  →  BUILD  →  RUN / SCALE  →  IMPROVE
 Concepts        Kratos        Scenarios (what)   Copilot     Foundry        loop
 Platform      (live demo)     Playbooks (how)
                               Home prompt (scratch)
        Skills catalog = reference, consulted throughout
```

"Choose a start" has exactly three on-ramps, all converging on the same Build → Run → Scale machinery:

| The user wants… | Surface | Mode |
| --- | --- | --- |
| a proven industry blueprint | **Scenarios** | adapt |
| to learn a specific technique | **Playbooks** | learn |
| to build a novel idea with no template | **Home prompt → Make it real** | greenfield |

## The "I want to…" contract

This is the decision tree surfaced in the UI (see the "What to use when" panel on Home):

- *"…see a working agent right now, no setup"* → **Kratos**
- *"…understand the model / platform"* → **Concepts / Platform**
- *"…find something for my industry"* → **Scenarios**
- *"…learn how to do X (grounding, eval, governance, voice)"* → **Playbooks**
- *"…build my own idea from a prompt"* → **Home**
- *"…look up a specific capability"* → **Skills catalog**

## Navigation grouping

The sidebar groups items by intent to mirror the spine:

- **Start here** — Home, Kratos
- **Build** — Scenarios, Playbooks, Skills catalog
- **Learn** — Concepts, Platform

## How Scenario ⇄ Playbook links are derived

Scenario `tags` (e.g. *Knowledge Grounding*, *Governance*, *Real-Time Conversations*) are
**techniques**. Each playbook declares the `techniques` it covers. Cross-links are computed
by matching the two — no per-scenario hand-editing. The `getting-started` playbook is a
universal starter shown on every scenario. See `src/data/playbooks.json` and
`src/data/links.ts`.
