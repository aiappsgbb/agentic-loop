# Reference Architecture on the Agentic Loop Site — Implementation Plan

> Target repo: `https://github.com/aiappsgbb/agentic-loop-site.git` (React + Vite SPA, client-side only)
> Source artifact: [`assets/agentic-loop-reference-architecture.excalidraw`](../assets/agentic-loop-reference-architecture.excalidraw)
> Status: approved · ready for autopilot implementation on a feature branch

---

## 1. Goal

Put the agentic-loop reference architecture on the site in a way that conveys **the core building blocks** of an
agentic-loop solution (the *spine*) plus the **complementary services** (the *support*), without confusing
first-time visitors or competing with the Home hero's "Make it real" conversion flow.

The diagram must clearly separate **core vs. complementary vs. foundation**, be **theme-aware** (Light/Dark/System),
**responsive**, and **interactive** (boxes deep-link into existing Foundry/Azure cards).

## 2. Confirmed decisions

1. **Restructure Platform** from two flat catalogs into one system with three depths:
   `Platform → Overview (new) · Foundry · Azure`.
2. **Canonical complementary labels** (the "IQ + ops" family):
   `Foundry IQ` · `Work IQ` · `Fabric IQ` · `Toolbox` · `Evals` · `Observability`.
   (Rename the Excalidraw's "Microsoft Fabric" → Fabric IQ and "M365 + Graph" → Work IQ for a coherent story.)
3. **Sidebar label** for the new page: **"Overview"**.
4. **GHCP SDK** node deep-links to the **Agentic Loop concept** page (Build side) — no new dedicated card.

## 3. Information architecture

```
Platform
 ├─ Overview        ← NEW landing: the reference architecture (interactive map)
 ├─ Foundry         ← existing cards = "RUN core + complementary IQ" drill-down
 └─ Azure           ← existing cards = "platform & data" drill-down
```

`/concepts/platform` index stops redirecting to `foundry` and lands on **Overview**.
The Overview diagram is the visual table-of-contents for the whole Platform section: each box deep-links into the
matching existing card (e.g. `#frontier-models`, `#identity`, `#observability`).

## 4. The diagram — three visual weights (progressive disclosure)

- **Spine (dominant, center, drawn as the loop):**
  `GitHub Copilot SDK` → `Hosted Agent (Foundry)` → `Foundry Model` → (loop back).
  This is "what every solution has."
- **Complementary ring (secondary, around the spine):**
  `Foundry IQ` · `Work IQ` · `Fabric IQ` · `Toolbox` · `Evals` · `Observability`.
  "Add what your scenario needs."
- **Foundation band (muted, underneath, can dim/expand):**
  `Entra / RBAC` · `Key Vault` · `App Insights` · `AI Search` · `Cosmos` · networking.
  "Always there, rarely the headline."

One artifact → reads as L200 at a glance, L400 on inspection.

## 5. Two-tier placement

| Tier | Where | What | Job |
|---|---|---|---|
| **Teaser** | Home, between `Hero` and `ScenariosGallery` | Spine (3 boxes as a loop) + complementary chips row + one CTA | "Here's what you're about to build" without stealing the hero's *Make it real* conversion |
| **Full map** | **Platform → Overview** (new landing) | Spine + complementary ring + foundation band, every box deep-linking into Foundry/Azure cards | Interactive table of contents for the Platform section |

Teaser CTA → `/concepts/platform` (Overview). Overview boxes → individual cards. Funnel: glance → map → detail.

## 6. Codebase changes (surgical)

- **New** `src/pages/concepts/PlatformOverview.tsx` — the architecture page (theme-aware SVG/HTML using existing tokens).
- **New** `src/components/ArchitectureStrip.tsx` — shared core; `variant="compact"` for Home, `variant="full"` for Overview (one source of truth, two densities).
- **Router** `src/main.tsx` — `platform` index → `<PlatformOverview />` instead of `Navigate to="foundry"`; add explicit `platform/overview` route.
- **Sidebar** `src/components/Sidebar.tsx` — add **Overview** above Foundry under Platform; keep active-route submenu behavior.
- **Home** `src/pages/Home.tsx` — insert `<ArchitectureStrip variant="compact" />` between `<Hero />` and `<ScenariosGallery />`.
- **Styles** `src/styles/app.css` — new classes for the strip/overview using `--surface`, `--border`, `--accent`, `--gradient-soft`; respect Light/Dark/System. No raster export.

## 7. Deep-link map (box → existing card)

| Diagram box | Target |
|---|---|
| GitHub Copilot SDK | `/concepts/agentic-loop` (Build side) |
| Hosted Agent | `/concepts/agents` or `/concepts/platform/foundry` |
| Foundry Model | `/concepts/platform/foundry#frontier-models` |
| Foundry IQ | `/concepts/platform/foundry#knowledge` |
| Toolbox | `/concepts/tools` |
| Evals | `/concepts/platform/azure#observability` (evals/observability) |
| Observability | `/concepts/platform/azure#observability` |
| Work IQ | `/concepts/platform/azure#integration` (M365/Graph) |
| Fabric IQ | `/concepts/platform/azure#data` (Fabric/OneLake) |
| Entra / RBAC | `/concepts/platform/azure#identity` |
| Key Vault | `/concepts/platform/azure#identity` |
| App Insights | `/concepts/platform/azure#observability` |
| AI Search | `/concepts/platform/foundry#knowledge` |
| Cosmos | `/concepts/platform/azure#data` |

(Verify exact hash IDs against `Foundry.tsx` / `Azure.tsx` card `id`s during implementation; adjust as needed.)

## 8. Validation

- `npm install` then `npm run build` MUST pass (spec requires TS strict mode + ESLint clean — see `docs/spec.md` FR-022).
- Manually verify Light/Dark/System rendering and that all deep links land on the correct card.
- Confirm Home teaser does not push the hero CTA below the fold on common laptop viewports.

## 9. Cross-repo workflow

1. Clone `agentic-loop-site` as a **sibling** folder (not nested): `c:\Users\charendt\code\agentic-loop-site`.
2. Branch: `feat/reference-architecture-overview`.
3. Implement §6, validate §8.
4. Commit. **Pause before pushing** — pushing + PR are explicit, human-confirmed actions.
