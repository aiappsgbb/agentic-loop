# Agentic Loop Site

A static marketing and learning site for the **Agentic Loop**: building and running AI agents with **GitHub Copilot** + **Microsoft Foundry** on **Azure**.

It is content-only — no backend, no LLM calls at runtime. Its job is to inspire, educate, and hand off to GitHub Copilot for the actual build.

## What's inside

- **Home** — pick Capabilities, Building blocks, and Themes; craft a mock prompt; preview suggested Build/Run skills; open the **Make it real** modal that points to the Copilot CLI (`/lean:implement`, `/lean:deploy`, `azd up`).
- **Scenarios** — filterable gallery of industry scenarios; each opens a Build / Run / Scale playbook stepper.
- **Playbooks** — markdown-driven slide decks rendered from `playbooks/<slug>/README.md` with chapter rail, code copy, callouts, and a pinnable TOC.
- **Skills catalog** — skills grouped by Build (Copilot) and Run (Foundry) phases.
- **Concepts** — Agentic Loop, Agents, Skills, Tools.
- **Platform** — Foundry capabilities and Azure building blocks with deep-linkable cards.

## Tech stack

React 19 · TypeScript (strict) · Vite 8 · React Router 7 · `react-markdown` + `remark-gfm` + `rehype-highlight` · `lucide-react` · hand-authored CSS with light/dark/system theming.

## Scripts

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # tsc -b && vite build  →  dist/
npm run preview  # serve the production build locally
npm run lint     # eslint .
```

## Project layout

```
src/
  components/   Hero, Sidebar, CapabilityPicker, ScenariosGallery, MakeItRealModal, ThemeProvider
  pages/        Home, Scenarios, ScenarioPlaybook, Playbooks, PlaybookPage, SkillsCatalog, concepts/*
  data/         scenarios.json
  styles/       app.css
playbooks/      <slug>/README.md  (rendered as slide decks at /playbooks/:slug)
public/         images/*, playbooks/<slug>/images/*, Foundry.svg, Azure.svg
docs/spec.md    Full functional spec
```

## Deployment

Produces a single static bundle (`dist/`) suitable for Azure Static Web Apps or any CDN. See [deploy.ps1](deploy.ps1) and [docs/spec.md](docs/spec.md).

## License

See [LICENSE](LICENSE).
