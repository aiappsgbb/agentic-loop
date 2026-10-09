# Agentic Loop Portal — Workshop Flow

## Current customer-workshop flow

Use **Start a technical workshop** (`/workshop`) for a customer build conversation and **Show an industry demo** (`/scenarios`) for showcase. The workshop reuses Launchpad and the existing build hand-off.

1. Edit or replace the sample customer brief. Each fresh portal session randomly starts with one of three examples: HR policy answers, maintenance-system troubleshooting, or shared-room scheduling. The sample stays unchanged during navigation unless you edit it; clearing it leaves an empty field. Industry examples stay on the separate showcase route; a scenario's workshop link keeps its own editable context. Keep approved sample data ready. Technical requirements are three checkbox columns: capabilities, building blocks and candidate patterns, with relevant defaults selected for samples and industry scenarios. **Frontier Models is always selected and cannot be removed**, including for custom briefs and guide links. Adjust the other selections as needed; describe custom requirements in the brief instead of separate technical inputs.
2. Prepare the workshop entirely in your browser using curated matching rules. **Proposed workshop approach** explains why each guide fits, what implementation material it provides, what needs adapting, and its prerequisites and exclusions, all visible without expandable panels. Including a guide adds a link to its implementation instructions and recommended build skills to the Copilot prompt; it does not deploy an app or automatically implement a capability. Partial/no-match cases preserve covered guidance and surface gaps for explicit manual decisions in scope notes. There are no AI proposals, companion service or SDK calls in preparation. Add other guides through **Add another guide (optional)**; manual selection still needs customer validation.
3. Use the compact **Review workshop** section: confirm who will use the pilot, define testable success criteria, and add scope notes or decisions. The brief supplies the pilot scope; approved sample data, authorized access, verification evidence and production exclusions remain baseline requirements. Scope notes are optional for fully covered pilots but required to explicitly resolve gaps and open questions. Do not treat missing catalog coverage as infeasibility. The build workflow is a visible selector, not an expandable panel.
4. Select **Confirm scope & get prompt**. This single action confirms the current scope and opens the hand-off in this order: **Prepare your environment → Create your project → Your build prompt**. Already set up? Select **Your build prompt** directly. The button explains any missing users, success criteria or gap decisions. It does not run Copilot or deploy resources. Any edit invalidates confirmation and requires confirming again; unchanged scope can be reopened with **Open build prompt**. The confirmed scope and copied prompt use Markdown headings, prose and lists, not JSON. All specification fields and decisions remain included. Drafts survive navigation in memory, not refresh.
5. Use **GitHub Copilot App**: sign in, add the Spec2Cloud marketplace and install its lean plugin with the provided App links. Set up the separate **Spec2Cloud Cockpit** canvas during **Prepare your environment**: in the right-hand review panel choose **+ → Spec2Cloud Cockpit**; if missing, use **Discover more → Import canvas from gist/URL → User scope** with the [official extension URL](https://github.com/Azure-Samples/Spec2Cloud/tree/main/.github/extensions/spec2cloud). After importing, select **+ → Spec2Cloud Cockpit** if needed and confirm the **Spec2Cloud** tab appears. The canvas follows the build and exposes Azure resources; it does not grant deployment permissions or replace Azure sign-in. Run supporting terminal authentication and checks in the build execution environment, including a sandbox, then add your project folder or repository and install the required project skill. These commands do not launch Copilot CLI. Paste the complete Markdown prompt into App Chat. Confirmed-spec review and optional run-skill guidance remain available in the dialog. Return to **Your build prompt** after choosing run skills to copy the updated version. Run the existing workflow with Specify/Plan review and permission checkpoints.
6. Verify MVP behavior, access boundaries, safe data handling and failure paths. Capture evidence and remaining production work. Optional development deployment does not certify production readiness.

Use the [production portal](https://aka.ms/agentic-loop) for this flow; no repository clone, package installation or local development server is required. The portal cannot verify CLI/Azure readiness and does not provision or execute commands. Workshop preparation needs only the portal; no Copilot authentication or companion setup is required. Prepare subscription scopes, resource/RBAC rights, model availability and approved data before running the copied prompt in your project. Public static hosting and local development have the same preparation behavior. Copilot SDK build guidance remains available for the application being built, not as a portal runtime dependency.

## Required Agentic Loop build policy

Workshop and Getting Started use the same project-scoped `agentic-loop` skill. It translates the [reference architecture service map](../skills/agentic-loop/references/reference-architecture.md) into concrete specification and implementation rules: Foundry hosted agents and models, governed skills and toolbox MCP, keyless identity, observability and `azd` deployment. Complementary services are selected only when the customer scope needs them.

This is a build-time policy skill for Copilot, not a run skill for the customer's agent. Project setup installs it and exposes source/version/pin and dry-run update checks. Installation is not invocation. The sequence is **readiness pre-flight → Specify → invoke agentic-loop → Plan**: run the RBAC pre-flight before step 1, then invoke the policy after Specify writes the concrete spec and before Plan. Carry its decisions through Implement, Verify and Deploy; no separate full policy invocation before Specify is required. Missing/failed invocation stops progression to Plan; a BLOCKED/ERROR pre-flight stops the build before step 1.

Review the invoked skill path, pre-flight verdict and resulting architecture decisions recorded in `docs/spec.md` and carried into `docs/plan.md`. These make policy application reviewable by the SE; they are not proof supplied by the portal. Preparation remains client-side and cannot verify external build execution.

## Learn while building

Playbooks are teaching material, not just implementation links. They give the Solution Engineer context, a guided example and a concrete platform capability to explain to the customer. The proposal shows what each selected guide explores; the prompt hand-off links back to those playbooks.

For a first workshop on a topic, use the relevant playbook to walk through the approach, explain the design choices and demonstrate verification evidence. After learning it once, use the tailored prompt for subsequent builds without following every tutorial step again. Scope, permission and verification reviews still apply.

Curated starting points keep the workshop specific: connect the chosen capabilities to the customer's requirements instead of producing a generic app. The build prompt asks Copilot to explain these choices and leave a concise, repeatable walkthrough. If no playbook fits, teach the custom design and its limitations rather than substituting an unrelated example.

## Historical framing (not the implemented hand-off)

The following earlier discussion records unresolved persona/export concepts. It is not a requirement to make Kratos the workshop execution target or a claim that its proposed production hand-offs are implemented.

> The end-to-end flow to walk on screen using **only the Agentic Loop web portal**.
> ⚠ markers flag the steps that still depend on an **outstanding alignment/decision**.

## How to read this

This guide is **only the flow** to walk on screen, end to end. Status markers:

- ✅ **Stable** — ready to demo as-is.
- ⚠ **Needs refinement** — depends on an open alignment/decision (listed in *Outstanding alignment* at the end). Demo with a caveat or skip live.

## The flow

The single diagram to hold on screen for the whole session. It frames the **problem**, the **constant stack**, and the **standardized Idea → Pilot → Production path**.

### 1 · Frame the problem

> Pilots are cheap. Ungoverned production is expensive.
> The cure is **one standardized path that never changes shape** — from a first idea to a governed, observable, evaluated production agent.

### 2 · How we tackle it — the constant stack

Three things stay the same at **every** stage. They are the answer to "how", before any tool is opened:

| Layer | Role | Stays constant because… |
| --- | --- | --- |
| **GitHub Copilot** (SDK + SKILLs) | **Builds & orchestrates** the agent | The same SKILLs author code at every maturity. |
| **Foundry Hosted Agents** | **Run** the agentic loop in a governed runtime | The pilot and production agent share one runtime shape. |
| **Foundry Models** | **Govern** — models, evals, safety | Evals and policy follow the artifact from pilot to prod. |

### 3 · The standardized path — one artifact, three stages

```mermaid
flowchart LR
  subgraph PATH["Idea → Pilot → Production  (one artifact, three maturities)"]
    direction LR
    Idea["✅ **Idea**<br/>Scenario or prompt<br/><i>the WHAT</i>"]
    Pilot["⚠ **Pilot**<br/>Kratos persona<br/><i>same WHAT, running live</i>"]
    Prod["⚠ **Production**<br/>Export → azd up<br/><i>your repo on the Agentic Backbone + add-ons</i>"]
    Idea -->|"⚠ a) Scenario ≡ Persona"| Pilot
    Pilot -->|"⚠ b) Playbook ≡ Export"| Prod
  end
  Play["✅ **Playbooks** — the HOW<br/>(Build + Deployment SKILLs)"]
  Play -. "configure the persona" .-> Pilot
  Play -. "package for azd up" .-> Prod
  Stack["✅ **GitHub Copilot** builds · **Hosted Agents** run · **Foundry Models** govern"]
  Stack === PATH
```

> ⚠ The two dashed handoffs (**a** and **b**) are the parts of the flow that are **not yet aligned**. They work conceptually but are not wired in the portal — see *Outstanding alignment*.

**The one line the flow should deliver:**

> Pick a **Scenario** *(Idea)* → experience it as its **Kratos persona** *(Pilot)* → **export that persona** through the deployment playbooks to **`azd up`** *(Production)* — with **Copilot building, Hosted Agents running, Foundry Models governing** the whole way.

### 4 · Outstanding alignment — what each ⚠ in the flow is blocked on

These are the decisions that must close before the flow can be shown end-to-end without caveats.

| Flow point | ⚠ Open decision | Status | What it blocks |
| --- | --- | --- | --- |
| **Idea → Pilot** | **a) Scenario ≡ Persona** — do scenarios map 1:1 to Kratos personas (shared id, skills derived from tags → playbooks)? | Open | "Try live" and "Build" being the *same* artifact. Today personas are a separate catalog. |
| **Pilot → Production** | **b) Playbook ≡ Export** — is the Kratos/Agentic Backbone architecture the advisor's canonical run target, with Deployment SKILLs as its export checklist? | Open | One deploy story ending in `azd up`. Today export and advisor `azd up` are two paths. |
| **Pilot node** | **Kratos: live or mock?** — must Kratos be genuinely live for the audience, or is the current mock acceptable? | Open | Whether the Pilot stage can be demoed for real vs. narrated. |
| **Whole frame** | **Audience altitude** — GTM/exec (high-level) vs. field/technical (hands-on). | Open | How deep to go at each node; possibly two cuts of the flow. |
| **Production + beyond** | **Scope cut** — is Run/Scale in scope for this cut, or stop at first `azd up`? | Open | Whether the flow ends at Production or continues into the loop. |
| **All nodes** | **Narrative ratification** — is this Problem → Stack → Idea/Pilot/Production the one agreed spine? | Open | Everyone telling the same story; locks this diagram as canonical. |

### Fallback ASCII (if Mermaid won't render)

```
              ┌──────────────── constant stack ────────────────┐
              │ GHCP builds · Hosted Agents run · Foundry govern │
              └──────────────────────┬──────────────────────────┘
                                     │
   IDEA ───────────────►  PILOT ───────────────►  PRODUCTION
   Scenario / prompt      Kratos persona ⚠        Export → azd up ⚠
   (the WHAT) ✅          (same WHAT, live)        (Agentic Backbone + add-ons)
        ▲                      ▲                        ▲
        └── ⚠ a) same id ──────┘                        │
                               └── ⚠ b) playbooks = export checklist ──┘
                          Playbooks ✅ = the HOW (Build + Deploy SKILLs)
```
