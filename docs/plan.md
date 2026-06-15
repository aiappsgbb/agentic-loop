## Plan: Three-Path Advisor

Implement the refined three-path model by extending the existing static portal rather than replacing it. The current Home hero, Kratos launcher, Scenario pages, Playbooks catalog, and guided modal stay in place. The implementation adds a shared advisor data model that maps requirements to upstream build/deployment SKILLs, playbooks, tools, and Foundry/Azure run recommendations, then reuses that model from the greenfield idea flow and scenario flow.

**Steps**

1. **Create shared advisor data and matching helpers.**
   - Add `src/data/advisor.ts` with requirement definitions, upstream SKILL metadata, default deployment SKILLs, requirement-to-SKILL mappings, playbook matching, architecture recommendations, and package generation.
   - Extend the existing `Playbook` type in `src/data/links.ts` to carry `buildSkills` and `deploymentSkills`.

2. **Enrich playbook metadata.**
   - Update `src/data/playbooks.json` so each playbook declares `buildSkills` and `deploymentSkills` using upstream names from `aiappsgbb/agentic-loop/.github/skills`.
   - Keep existing fields intact so current Playbooks UI and Scenario bridge continue to work.

3. **Refactor greenfield flow into Production Launchpad.**
   - Update `src/components/GreenfieldBuilder.tsx` to use deterministic advisor package generation instead of random skill pools.
   - Keep the current prompt textarea, pickers, processing affordance, and Make it Real modal.
   - Show requirement ticks, selected playbooks, Build SKILLs, Deployment SKILLs, tools, and run architecture recommendations.

4. **Update Make It Real package modal.**
   - Update `src/components/MakeItRealModal.tsx` props and copy to distinguish Build SKILLs from Deployment SKILLs.
   - Include selected playbooks, architecture checklist, Copilot prompt, and `azd up` deployment guidance.

5. **Make Scenario Advisor entry additive.**
   - Update `src/pages/ScenarioPlaybook.tsx` to generate a scenario-seeded advisor package from scenario tags and related playbooks.
   - Add a "Build this scenario with Copilot" advisor card near the existing playbook bridge.
   - Reuse the existing Make It Real modal instead of adding a new route.

6. **Clarify What to use when and Playbooks catalog.**
   - Update `src/components/WhatToUseWhen.tsx` to show exactly three paths: Kratos, Production Launchpad, Scenario Advisor.
   - Update `src/pages/Playbooks.tsx` to surface Build and Deployment SKILL bindings per playbook while preserving current links and layout.

7. **Document the implementation.**
   - Create `docs/implementation.md` with the implemented architecture, additive decisions, data flow, and deviations from the plan/spec.

**Relevant files**

- `C:\Users\charendt\code\agentic-loop-site\src\data\advisor.ts` — new shared advisor model and package generator.
- `C:\Users\charendt\code\agentic-loop-site\src\data\playbooks.json` — enrich playbook metadata with build/deployment SKILL bindings.
- `C:\Users\charendt\code\agentic-loop-site\src\data\links.ts` — update `Playbook` type.
- `C:\Users\charendt\code\agentic-loop-site\src\components\GreenfieldBuilder.tsx` — convert existing greenfield area into Production Launchpad without replacing it.
- `C:\Users\charendt\code\agentic-loop-site\src\components\MakeItRealModal.tsx` — expand generated package view.
- `C:\Users\charendt\code\agentic-loop-site\src\components\WhatToUseWhen.tsx` — clarify three paths.
- `C:\Users\charendt\code\agentic-loop-site\src\pages\ScenarioPlaybook.tsx` — add Scenario Advisor hand-off.
- `C:\Users\charendt\code\agentic-loop-site\src\pages\Playbooks.tsx` — expose playbook skill bindings.
- `C:\Users\charendt\code\agentic-loop-site\src\styles\app.css` — add styles for advisor result/package affordances.
- `C:\Users\charendt\code\agentic-loop-site\docs\implementation.md` — implementation record.

**Verification**

1. Run `npm run build`.
2. Run `npx eslint src\data\advisor.ts src\components\GreenfieldBuilder.tsx src\components\MakeItRealModal.tsx src\components\WhatToUseWhen.tsx src\pages\ScenarioPlaybook.tsx src\pages\Playbooks.tsx`.
3. Use the integrated browser at `http://localhost:5174/` to verify:
   - Home shows exactly three paths.
   - Production Launchpad produces deterministic Build SKILLs, Deployment SKILLs, playbooks, and run architecture.
   - Scenario page opens a scenario-seeded package.
   - Playbooks show their Build and Deployment SKILL bindings.

**Decisions**

- Use `AZD template: none` for this implementation because the current task is a static portal/product-flow implementation and the spec says the browser does not provision Azure resources.
- Keep generated packages client-side and text-only.
- Preserve existing Home, Kratos, Scenarios, Playbooks, and modal components; make additive changes only.
- Treat repository-wide lint failures outside touched files as pre-existing unless touched-file lint fails.

**Further Considerations**

1. Later planning can decide whether to sync upstream `.github/skills` dynamically or keep the local curated mapping.
2. Later implementation can add a downloadable ZIP/repo scaffold if text-only packages are insufficient.
