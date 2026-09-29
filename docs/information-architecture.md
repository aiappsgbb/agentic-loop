# Information Architecture — what to use when

This document is the source of truth for how the Agentic Loop site is organized.
Every page's positioning copy and every cross-link derives from the model below.

## The problem it solves

The site has several surfaces that can feel overlapping. A first-time visitor must be
able to answer **"what do I use, and when?"** in seconds. This IA encodes that answer.

## The model — two axes plus a mode

| Surface | One-line job | Axis / mode |
| --- | --- | --- |
| **Astra demos** (external) | Show a customer a polished industry demo, no code | Demo (show it now) |
| **Home prompt → Make it real** | Build a novel idea from a blank prompt | Greenfield (from scratch) |
| **Kratos** | Try a live reference agent, then fork it as a production-shaped base | Experience + production template |
| **Scenarios** | Start from a proven industry **outcome** | WHAT (vertical) |
| **Playbooks** | Reusable implementation **techniques** selected by the advisors | HOW (horizontal support) |
| **Skills catalog** | Look up any Build/Run capability | Reference |
| **Concepts / Platform** | Understand the operating model + Azure substrate | Understand |

Two key relationships:

- **A Scenario is assembled FROM Playbooks.** Recipes (playbooks, horizontal techniques)
  combine into finished dishes (scenarios, vertical outcomes). They are orthogonal, not
  competing — every scenario page lists the playbooks it's built from, and every playbook
  lists the scenarios that use it.
- **An Idea selects Playbooks.** A greenfield idea has no predefined vertical outcome, so
  the advisor uses the user's requirements to choose the same horizontal techniques that
  scenarios use.
- **Kratos vs Scenarios is a mode split.** Kratos = *experience it live* (prebuilt,
  no build). Scenarios = *build it yourself* (a blueprint you fork). Kratos can host
  scenarios as personas, so "try live" precedes "build from blueprint."

## The spine

```
UNDERSTAND  →  EXPERIENCE  →  CHOOSE A START        →  BUILD    →  RUN / SCALE  →  IMPROVE
Concepts        Kratos        Idea (scratch)           Copilot     Foundry        loop
Platform      (live demo)     Scenarios (what)
                              Playbooks (how support)
        Skills catalog = reference, consulted throughout
```

"Choose a start" has exactly three user-facing paths, all converging on the same Build → Run → Scale machinery where Playbooks provide reusable HOW guidance:

| The user wants… | Surface | Mode |
| --- | --- | --- |
| to experience a working reference agent with no setup | **Kratos** | demo |
| to build a novel idea with no template | **Production Launchpad / Home prompt → Make it real** | greenfield |
| to start from a proven industry blueprint | **Scenario Advisor / Scenarios** | adapt |

Playbooks are not a fourth path. They are the reusable implementation techniques selected by Path 2 and Path 3.
Each advisor-selected playbook carries two skill bindings: **Build SKILLs** for creating the agentic solution and **Deployment SKILLs** for making it deployable with `azd up`.

## Start here — persona routing

The Home page is the single starting point. Its "Where to start" panel
(`src/components/WhatToUseWhen.tsx`) routes by persona first:

| Persona | Goal | Primary destination | Secondary |
| --- | --- | --- | --- |
| Seller (SSP / AE) | Show a customer an agent today, no code | **Astra demos** (external) | Industry scenarios |
| Solution engineer / builder | Build or customize, run a technical workshop | **Getting started playbook** | All playbooks, Launchpad (`#prompt`) |
| Customer / delivery team | Start from something production-shaped | **Kratos** | Idea to production (Threadlight) |

Below the cards, a collapsible comparison table answers "Astra demos vs playbooks vs
Kratos vs Idea to production". Astra demos are **demos on synthetic data, never
deployable**; that boundary is stated on Home, on the persona card and on scenario pages.

Destination URLs live in `src/data/destinations.ts`. The Astra demos URL can be
overridden with `VITE_ASTRA_DEMOS_URL` (e.g. once it is mounted behind Front Door).

## The "I want to…" contract

- *"…show a customer an industry demo right now"* → **Astra demos**
- *"…see a working agent right now, no setup"* → **Kratos**
- *"…start from a production-shaped app"* → **Kratos** (fork) or **Idea to production**
- *"…understand the model / platform"* → **Concepts / Platform**
- *"…build my own idea from a prompt"* → **Production Launchpad**
- *"…find something for my industry"* → **Scenario Advisor / Scenarios**
- *"…learn how to do X (grounding, eval, governance, voice)"* → **Playbooks** as advisor-selected HOW guidance
- *"…look up a specific capability"* → **Skills catalog**

## Scenario ⇄ Astra demo links

Scenarios that have a matching Astra demo (mapped in `ASTRA_DEMOS[].scenarioIds`)
show an **Astra demo** badge in the gallery, and their detail page swaps the
"Watch the demo" card for an "Open the Astra demo" card. This closes the loop
between *show it* (demo) and *build it* (scenario prompt + playbooks).

## Navigation grouping

The sidebar groups items by intent to mirror the spine:

- **Start here** — Home, Kratos, Astra demos (external)
- **Build** — Scenarios, Playbooks, Skills catalog
- **Learn** — Concepts, Platform

## How Scenario ⇄ Playbook links are derived

Scenario `tags` (e.g. *Knowledge Grounding*, *Governance*, *Real-Time Conversations*) are
**techniques**. Each playbook declares the `techniques` it covers. Cross-links are computed
by matching the two — no per-scenario hand-editing. The `getting-started` playbook is a
universal starter shown on every scenario. See `src/data/playbooks.json` and
`src/data/links.ts`.
