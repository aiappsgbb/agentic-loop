# Plan: Customer workshop entry and playbook reuse

Date: 2026-10-02
Repository: aiappsgbb/agentic-loop
Status: User-approved direction; implementation handover

## Objective

Make the existing customer-workshop route unmistakable without deleting playbooks or replacing their value with AI-generated solutions.

An SE should start from the customer's business problem, find maintained guidance where it fits, validate scope, and carry an agreed specification into the existing prompt/build flow. Playbooks remain reusable delivery assets, not a prerequisite taxonomy the SE must master.

The governing principle is **reuse first; generate only what is missing**.

## Confirmed decisions

1. Keep all existing playbooks and their content. Preserve existing deep links, scenario paths, demos, and expert access.
2. Make **Start a technical workshop** the primary customer-build action and **Show an industry demo** the separate showcase action.
3. Reuse the Launchpad, selectors, prompt crafting, and build hand-off. Do not create a competing execution system.
4. Begin with a customer brief or an industry example. Capabilities, building blocks, and patterns remain available, but must not be mandatory first decisions.
5. Prefer an existing playbook when it adequately covers the brief. Explain the match and adapt only customer-specific scope.
6. For a partial match, reuse the relevant guidance and use AI only for the missing parts.
7. For no suitable match, use GitHub Copilot SDK to propose capabilities, building blocks, and candidate patterns from the brief, then follow the same validation/specification/prompt/build flow.
8. Do not regenerate a complete solution approach through AI for every brief. AI can assist matching when necessary, but a strong playbook match must not trigger unnecessary gap-generation or bypass maintained guidance.
9. Suggestions are reviewable. The SE can accept, edit, or remove them. Candidate patterns are provisional until scope and constraints are validated.
10. No playbook match is a catalog-coverage result, not proof of technical infeasibility. Unclear requirements and unsupported capabilities need explicit clarification or a surfaced gap.
11. A workshop produces a tailored MVP/pilot with evidence and a path toward production. It must not claim production readiness simply because code was generated or deployment succeeded.
12. Keep baseline identity, safe data handling, and scenario-appropriate verification throughout the workshop. Do not defer essential safeguards to a later "production" section.
13. Do not decide the organizational Threadlight-versus-Agentic-Loop winner. Present each actual variant's declared scope and capabilities; validation should determine suitability.

## Evidence from the current implementation

The parent inspected the source and a saved home-page screenshot. Source is authoritative when the screenshot differs.

- `src/pages/Home.tsx` assembles `HomeHeadline`, `WhatToUseWhen`, `AgenticBackbone`, and `GreenfieldBuilder`.
- `src/components/WhatToUseWhen.tsx` exposes Kratos, Launchpad, and Industry scenarios as three equivalent starting paths.
- `src/components/Sidebar.tsx` puts Playbooks and Skills catalog prominently under Build, without a dedicated customer workshop entry.
- `src/pages/Playbooks.tsx` describes all playbooks as single-capability horizontal guides, although the catalog includes complete delivery workflows and shared infrastructure.
- `src/pages/ScenarioPlaybook.tsx` says "Built from these playbooks" and "Master each one on its own," making guides look like prerequisite homework.
- `src/data/playbooks.json` mixes a Weather Agent onboarding exercise, capability guides, governance/operations guidance, the Threadlight end-to-end pipeline, and Citadel infrastructure.
- Getting Started and Threadlight both declare wildcard patterns. `playbooksForScenario` in `src/data/links.ts` and `selectPlaybooks` in `src/data/advisor.ts` include wildcard playbooks indiscriminately.
- `inferRequirementsFromSelections` uses mappings and regex hints; current recommendations have no explicit coverage state, primary role, reason, or gap model.
- `GreenfieldBuilder` computes related guides separately from the advisor package, risking inconsistent displayed recommendations.
- `MakeItRealModal` crafts its own short `specPrompt`, rather than consuming the complete `advisorPackage.copilotPrompt`. Validate that approved scope and decisions survive this hand-off.
- The inspected `package.json` has React/Vite/TypeScript, build and lint scripts, but no Copilot SDK dependency or test script. Check the actual worktree before deciding what minimal additions are needed.

## User experience

### Home and navigation

Present two action-oriented customer choices:

```text
What do you need for this customer conversation?

[ Start a technical workshop ]
Turn the customer's requirements into a tailored MVP or pilot.

[ Show an industry demo ]
Explore a ready-made example. No setup required.

Already know which guide you need? Browse playbooks.
```

- Reuse the existing Launchpad components under the explicit workshop label.
- A dedicated `/workshop` entry is acceptable if it is a composition of the existing flow, not a second builder implementation.
- Keep old routes and anchor-based entry working; avoid breaking copied URLs.
- Treat industry examples as optional seeds within the journey, not a competing prerequisite.
- Make workshop and showcase visible in the sidebar. Retain the library, skills catalog, concepts, and platform information as secondary/direct-access destinations.
- Preserve the current visual language, responsive behaviour, accessibility, and theme support. Do not redesign the entire site.
- Clarify the workshop's MVP promise without erasing the site's broader pilot-to-production mission.

### Brief capture

```text
Start a technical workshop

What should the customer be able to do?
[ Business problem, intended outcome, constraints... ]

Starting point:
[ Customer brief ] [ Use an industry example ]

Technical requirements [expand]
Capabilities / Building blocks / Patterns

[ Prepare workshop ]
```

- Keep a freeform brief as the primary input.
- A selected industry example seeds editable customer context.
- Existing selectors remain an advanced editing surface.
- Do not silently invent a sample customer brief for an empty submission.
- Identify unclear constraints with focused questions. Avoid showing a long compulsory technical questionnaire before offering value.
- Preserve edits when navigating between brief, recommendations, scope, specification, and hand-off.

### Coverage and reuse

| State | Required behaviour |
| --- | --- |
| Strong match | Recommend a maintained playbook/workflow or a clearly sufficient composition, explain the coverage, and validate customer-specific scope. No unconditional AI re-architecture. |
| Partial match | Show what is covered, which guides contribute, and which requirements remain. AI proposes only the uncovered parts. |
| No suitable match | Say no packaged playbook covers the brief. AI proposes a customer-specific approach using the same workshop flow. |
| Needs clarification | Show the missing information and the effect on scope or selection. Do not claim a confident match prematurely. |
| Unsupported requirement | Identify the actual capability gap and offer an explicitly scoped alternative, if feasible. Do not silently substitute a solution. |
| Catalog/service failure | Report the failure. Do not relabel it "no match" or fabricate a recommendation. |

Strong versus partial matching must use meaningful requirement coverage and catalog metadata, not arbitrary confidence percentages or broad tag intersection alone. When multiple guides are needed, identify their roles rather than presenting them as equivalent alternative starting points.

### Workshop plan and specification

Present one customer-workshop plan:

- Business outcome and intended users.
- In-scope MVP capabilities.
- Out-of-scope work and production exclusions.
- Constraints, dependencies, and assumptions.
- Testable success criteria and required evidence.
- Proposed capabilities, building blocks, and candidate patterns.
- Chosen execution workflow and supporting guides, with match reasons.
- Uncovered or unvalidated elements, with an honest distinction from maintained guidance.
- Open questions that must be resolved before building.

For example, an HR-policy brief may recommend Enterprise Knowledge Grounding because citations from approved documents are required. Its canned example must not replace the customer brief.

Allow review and edits, then produce a structured specification. Make the approved scope/specification the source of truth for prompt crafting and hand-off. If upstream inputs change, invalidate or clearly mark downstream approvals as stale; never build against an old approved spec accidentally.

### Existing hand-off

Reuse/refine the existing modal:

1. Check environment readiness.
2. Review the approved brief, scope, and specification.
3. Craft/copy the build prompt.
4. Run the existing build loop with its supported review checkpoints.
5. Review MVP behaviour/evidence and capture next steps.

- Carry the actual approved customer scope, criteria, constraints, chosen guidance, and accepted suggestions into the prompt.
- Reuse supported build commands and policy-layer instructions. Do not invent a new runtime command.
- Distinguish optional development deployment from production rollout.
- Tell the SE to prepare subscriptions, permissions, model availability, and approved sample data before a live workshop.
- Do not imply the web portal can verify local CLI/subscription readiness unless a real implemented check exists.
- Do not auto-provision Azure resources or execute copied build commands from the portal.

## Library information architecture

Keep every playbook. Add explicit categories/roles:

| Category | Examples | Purpose |
| --- | --- | --- |
| Learn the workflow | Getting Started / Weather Agent | Practice and onboarding, not the automatic customer default. |
| Capability guides | Knowledge Grounding, Voice, Orchestration | Implement a requirement inside the customer workshop. |
| Delivery workflows | Idea to Production / Threadlight | A complete approach with declared prerequisites and scope. |
| Governance and operations | Safety Baseline, Continuous Evaluation, Citadel | Required controls and operations where appropriate, including shared infrastructure. |

- Preserve slugs and existing content.
- Do not imply skill level is the customer's journey stage.
- Replace the misleading universal "single capability" description.
- Use explicit actions such as "Practise this example," "Use in my workshop," and "Read the guide," as appropriate.
- Scenario pages should offer a customer-workshop action and describe playbooks as supporting guidance, not required courses.
- Threadlight classification must follow the shipped variant's actual documentation; do not generalize across unseen variants.

## Matching and recommendation architecture

Extend the catalog minimally with typed role/category and coverage metadata:

- Requirements addressed and prerequisites.
- Explicit conditions for suitability and exclusions.
- Role as onboarding, delivery workflow, capability guide, or operations/infrastructure support.
- Explanation of whether a guide is an example to adapt or an executable workflow.

Use one shared recommendation model across the library, scenarios, Launchpad, scope/specification, and hand-off.

- Wildcard eligibility must not mean universal recommendation.
- Do not recommend Getting Started and Threadlight automatically together.
- Do not select Multi-Agent Orchestration merely because a business process has multiple steps.
- Match reasons must identify evidence in the customer brief or validated selections.
- Separate "relevant supporting guide" from "chosen execution approach."
- All accepted decisions must carry into the same structured workshop state.
- Avoid duplicate ranking logic in `links.ts`, `advisor.ts`, and `GreenfieldBuilder`.

## GitHub Copilot SDK integration

The user explicitly selected GitHub Copilot SDK for gap/no-match interpretation. Do not replace it with direct model calls or hardcoded generated-looking responses.

### Runtime boundary

The current portal is a browser application. The Node SDK manages/communicates with a Copilot CLI runtime; it is not a browser-only dependency.

- Inspect existing hosting and service code first.
- Use a minimal server-side/local companion adapter if no suitable backend exists. Prefer a loopback-only local service for the first working implementation rather than silently requiring a new cloud identity/hosting platform.
- Keep SDK, CLI processes, authentication, and credentials server-side.
- Use configured existing signed-in CLI credentials for local operation. No hardcoded/shared credentials, browser tokens, or secrets in bundles.
- Add only necessary SDK/backend dependencies; document setup and launch.
- Preserve static hosting. If the AI service is unconfigured, show its unavailability explicitly while maintaining useful playbook-first and manual-review paths. The no-match AI path remains unavailable, not falsely "completed."
- Do not invent a production authentication/tenancy model. If public deployment needs additional approved infrastructure or identity design, record that exact limitation.
- Public/static hosting must not silently reach arbitrary localhost/private-network endpoints. Define intentional configuration and safe origin/CORS behaviour.

### AI request and response

Provide only the relevant brief, uncovered requirements, and allowlisted catalog/taxonomy context. Treat the brief and retrieved content as untrusted data.

The adapter should:

- Propose structured suggestions and explanations.
- Distinguish existing catalog IDs from new/custom suggestions.
- Include uncertainties, unresolved questions, and unsupported/unvalidated elements.
- Validate the model output against the application schema.
- Reject fabricated playbook IDs or silently expanded catalog values.
- Preserve partial-match covered guidance instead of re-deriving it.
- Make no filesystem writes, shell execution, deployment, unrelated MCP calls, or mutations. Explicitly restrict the session's tools using the supported SDK configuration.
- Handle missing authentication, unavailable runtime, timeout, cancellation, malformed output, and service errors explicitly.
- Dispose sessions/clients and use bounded requests/concurrency. Ignore stale responses when the brief changes.
- Keep customer text out of analytics/logs by default.

SDK documentation verified during planning:

- https://github.com/github/copilot-sdk
- https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md
- https://github.com/github/copilot-sdk/blob/main/docs/setup/multi-tenancy.md
- https://github.com/github/copilot-sdk/blob/main/docs/features/mcp.md

The docs confirm `CopilotClient`, server/runtime connections, signed-in CLI credential use, and client start/stop. Verify the current exact TypeScript API, tool restrictions, structured response support, cancellation, and session cleanup before implementing; do not copy guessed signatures from this plan.

## Implementation phases and dependencies

### Phase 1: Baseline and shared contract

- Inspect repository instructions, current worktree, routing, hosting, catalog, and build hand-off.
- Persist this approved plan in the implementation worktree as a directly related documentation artifact.
- Define workshop state, coverage states, recommendation roles, structured spec, and AI response contract.
- Extend catalog metadata without changing slugs.
- Add focused matching/contract fixtures.

### Phase 2: Shared reuse-first recommendation logic

Depends on Phase 1.

- Replace wildcard/tag accumulation with explainable coverage and suitability logic.
- Keep regex hints only as preliminary evidence, not an authoritative architecture generator.
- Consolidate shared helpers and preserve expert/manual override.
- Test strong, partial, absent, ambiguous, and unsupported cases.

### Phase 3: SDK adapter

Depends on Phase 1; can proceed independently of Phase 2's UI work.

- Implement the real SDK-backed service and documented runtime setup.
- Add schema validation, restricted session tools, lifecycle management, cancellation, and explicit errors.
- Invoke it for gaps/no-match, not unconditionally for strong matches.
- Add mocked service tests and a real sample-data smoke test when authenticated runtime access is available.

### Phase 4: Primary workshop experience

Depends on Phases 1 and 2; AI states integrate with Phase 3.

- Recompose existing components into the unmistakable workshop entry.
- Add brief capture, scoped recommendations, editable plan/specification, and approval state.
- Reuse selectors as technical detail.
- Wire homepage, sidebar, scenarios, and contextual library actions.
- Keep navigation state and deep links stable.

### Phase 5: Hand-off and documentation

Depends on Phase 4.

- Unify prompt generation so accepted state is carried end to end.
- Integrate existing environment preparation and build-loop guidance.
- Update library/category copy, onboarding guidance, README, and SDK service configuration documentation.
- Preserve the site's broader production guidance without overpromising workshop outcomes.

### Phase 6: Verification

Depends on all implementation phases.

- Run smallest focused tests, then repository build/lint.
- Verify UI paths and accessibility in a browser with representative briefs.
- Exercise the real SDK path with non-sensitive sample data if credentials/runtime are available.
- Report blockers honestly; no success-shaped fallback or claim of live SDK validation based only on mocks.

## Acceptance criteria

1. Home and sidebar clearly expose customer workshop and showcase actions without requiring knowledge of internal brands.
2. All current playbooks and deep links remain available.
3. An SE can start from a customer brief without first choosing a playbook, capabilities, or runtime architecture.
4. A strong documented match reuses maintained guidance; it does not call gap-generation unnecessarily.
5. Partial matches clearly preserve covered requirements and use AI only for identified gaps.
6. No-match requests use the real GitHub Copilot SDK to produce reviewable structured suggestions when configured.
7. Missing service/auth/runtime is surfaced explicitly. Failed retrieval is not called "no match."
8. Accepted and manually edited capabilities, building blocks, candidate patterns, constraints, exclusions, and criteria appear accurately in the reviewed spec and final copied prompt.
9. Editing upstream scope cannot leave an apparently current downstream approval.
10. Getting Started and Threadlight are not automatically recommended together solely because of wildcard metadata.
11. Displayed recommendations and generated hand-off do not diverge.
12. A workflow, capability guide, practice exercise, and shared infrastructure guide are distinguishable in the library.
13. Unsupported and uncertain requirements are shown, not silently implemented as fabricated platform support.
14. No SDK credential or privileged runtime is shipped to the browser. Brief analysis cannot execute shell/tools/deployment.
15. Existing demos, scenario seeds, theme behaviour, mobile layout, keyboard access, and normal build guidance remain usable.
16. README/setup documentation states the local AI-service requirements and any static/public deployment limitations.

## Verification matrix

Use non-sensitive fixtures and document expected outcomes:

| Fixture | Evidence to check |
| --- | --- |
| HR-policy answers requiring citations | Relevant grounding guidance; editable customer scope; no replacement with the canned example. |
| Straightforward supported scenario | Strong match; zero unnecessary gap-generation calls. |
| Known grounding plus an uncovered integration | Partial coverage; existing guidance retained; only the missing portion sent for generation. |
| Genuinely novel outcome | No-match state; validated SDK suggestions; same workshop flow. |
| Vague brief | Clarification state instead of arbitrary architecture. |
| Multi-step business process | No automatic multi-agent assumption. |
| Explicitly unsupported integration | Visible capability gap and scoped alternatives. |
| Empty brief | No random example substituted. |
| Malformed AI response / fake catalog ID | Explicit validation error; no fabricated selected asset. |
| SDK auth error / timeout / cancellation | Clear failure; no silent heuristic "success"; stale responses ignored. |
| Scope edited after approval | Spec/prompt review invalidated or clearly stale. |
| Static site without AI service | Existing catalog/manual path works; unavailable AI path explained. |
| Existing direct playbook/scenario link | Correct content still loads and offers appropriate workshop context. |

Run `npm run build` and `npm run lint` in the isolated implementation worktree. No tests were run in the user's primary checkout. Add only minimal test tooling if needed for the changed logic and contracts.

## Non-goals and boundaries

- No playbook deletion, whole-site visual redesign, or wholesale content rewrite.
- No automatic customer deployment or new production-readiness certification.
- No Azure provisioning, purchased services, credential creation, tenant permission changes, or public AI-service exposure without explicit approval.
- No new top-level architecture ideology or forced single-agent/multi-agent choice.
- No organizational verdict on unseen Threadlight variants.
- No public issue/PR posting, push, or release unless separately requested.
- No SDK-looking mock substitute in the delivered application.

## Worktree and handover notes

Source session: `67bf5075-d23b-426e-b33c-362073f53012` ("Agentic loop and threadlight").
Project: `8ee764fe-8b7b-4886-a8bb-8d4ff4d80725`.
Primary checkout: `/Users/charendt/.copilot/repos/agentic-loop`.
Inspected HEAD: `335d180` ("Save uncommitted changes").

The primary checkout has one uncommitted README edit: `<p align="center">` changed to `<p align="left">` around the live-site link. Do not revert, overwrite, or commit that primary-checkout change. A new isolated worktree may not contain it; preserve its intent if modifying the same README section, but perform all implementation and execution only in the new worktree.

The new session should implement autonomously in its isolated worktree, verify the result, and report the changed surfaces, tests, real SDK status, and any concrete deployment/authentication blockers. The parent's task is the persistent plan and handover, not completion of the future implementation.
