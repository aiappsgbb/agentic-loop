# Workshop SDK companion and implementation contract

The portal remains React/Vite with static GitHub Pages and Static Web Apps hosting. The optional Node companion is a loopback-only analysis service, not a deployment engine. There is no new Azure resource, credential, tenancy model or public AI endpoint.

## Frozen contract

| Surface | Contract |
| --- | --- |
| SDK | `@github/copilot-sdk` **1.0.16**, pinned in the npm lockfile; Node `^20.19.0` or `>=22.12.0` |
| Process boundary | Node SDK spawns its bundled compatible runtime over stdio; browser imports only typed workshop contracts |
| Authentication | `useLoggedInUser: true`; existing signed-in CLI/OS credential or `gh` authentication. No copied credential files, browser tokens or new credentials |
| Bind | `127.0.0.1:4318`; `WORKSHOP_PORT` can change the companion port, but the dev proxy target remains explicitly 4318 |
| Browser opt-in | `VITE_WORKSHOP_AI=local`, Vite development mode, loopback browser hostname. Static/public builds never invoke the adapter |
| Dev proxy | `/agentic-loop/api/workshop/*` -> `http://127.0.0.1:4318/api/workshop/*` |
| Origins | Exact HTTP loopback origins in `WORKSHOP_ORIGINS`; defaults `http://localhost:5173,http://127.0.0.1:5173`. Public origins, credentials and arbitrary private endpoints are not accepted |
| Request | `POST /api/workshop/analyze`, JSON, `Origin` required, `X-Workshop-Client: portal`; `AnalysisRequest` has `brief`, typed `gaps`, `coveredRequirementIds` |
| Health | `GET /api/workshop/health`; reports service availability only, **not authentication or Azure readiness** |
| Output | `AIProposal`: `suggestions`, `guideIds`, `questions`, `uncertainties`, `unsupported`; schema and catalog-ID validation in both service and browser |
| Suggestion | `kind`, `source: catalog\|custom`, `id`, editable `label`, `reason`, gap-only `addresses`; custom IDs must begin `custom-` |
| Scope | `WorkshopSpec` owns brief/outcome/users, scope/exclusions, constraints/dependencies, assumptions, criteria/evidence, selections, execution, chosen guidance/reasons, accepted proposals, gaps, questions and resolutions |
| Approval | Exact structured-spec snapshot; any upstream edit invalidates it. The full approved spec is used by `AdvisorPackage.copilotPrompt` and copied unchanged by the existing modal |
| Execution | Existing `/spec2cloud` build loop, or the shipped `threadlight-design` skill when explicitly chosen; manual execution outside the portal |
| Resource limits | One analysis at a time, minimum one-second admission interval, 24 KB request, 3,000-character brief, 20 gaps/suggestions, 90-second analysis deadline; cleanup steps capped at five seconds each |
| Errors | Explicit `AUTH_REQUIRED`, `RUNTIME_UNAVAILABLE`, `TIMEOUT`, `CANCELLED`, `INVALID_OUTPUT`, `CLEANUP_FAILED`, request/origin/host/rate-limit errors; no generated-looking fallback |
| Storage/logging | Drafts in browser memory only. Isolated runtime directories under ignored `.workshop-runtime` are removed after each request. Default application logs contain only fixed error codes, not briefs, prompts or raw SDK errors |

## Local setup

Use an existing approved Copilot subscription and sign in with the CLI. Do not submit private customer data for setup or smoke tests.

```bash
npm ci
copilot login

# Terminal 1
npm run workshop:service

# Terminal 2
VITE_WORKSHOP_AI=local npm run dev

# Terminal 3, optional live validation
npm run workshop:smoke
```

Open `http://127.0.0.1:5173/agentic-loop/workshop`. You can instead set `VITE_WORKSHOP_AI=local` in an ignored `.env.local`. The service reads `WORKSHOP_MODEL` and `WORKSHOP_ORIGINS` from its process environment, not from browser configuration.

`WORKSHOP_MODEL` defaults to `gpt-5.4-mini`; your Copilot plan and organization must allow it. Authentication is checked per analysis. A running HTTP health endpoint does not prove model access. Missing authentication, model policy failures and malformed outputs remain visible. No login or permission grant is performed by the web page.

## Analysis isolation

The installed SDK APIs and current Context7 documentation were consulted before implementation. SDK 1.0.16 provides `mode: "empty"` plus explicit persistence and tool configuration. Each request gets a fresh client/session in a named isolated directory, with:

- Empty available tools, all built-in/MCP/custom tools excluded, deny-all permission handler and pre-tool hook.
- No MCP servers, plugins, skill directories, file hooks, host Git operations, discovered configuration, custom instructions, memory or infinite sessions.
- Replaced analysis-only system instructions. Customer/catalog JSON is untrusted data, not executable instructions.
- Per-send `responseSchema` JSON Schema constrains exact requested gap IDs, catalog kinds/IDs and custom namespaces before generation; runtime JSON output is independently validated against the same contract.
- `sendAndWait(options, timeout)` and explicit `abort()` on failure/cancellation; `disconnect()`, `deleteSession()` and `stop()` on completion. Force-stop is used when bounded cleanup fails.
- Runtime content telemetry disabled. Copilot service processing itself is still subject to your existing GitHub subscription/organization data policies.

Session metadata may exist temporarily inside the isolated runtime directory. It is not retained by this application. Tool-denial and request validation are application boundaries, not an OS sandbox or a claim that an arbitrary untrusted runtime binary is safe.

## Reuse and suitability

`src/data/catalog.ts`, `src/data/playbooks.json` and `src/data/workshop.ts` share typed role/coverage metadata. `links.ts`, advisor packages and Launchpad use the same coverage model. Wildcard tags retain historical eligibility but do not recommend assets universally.

Evidence rules detect requirements conservatively; they do not generate an architecture or an arbitrary confidence score. Unknown requested clauses, integrations and unsupported constraints remain gaps. A strong result means the detected requirements have documented guidance, **not** that customer prerequisites or technical feasibility have been proven. Scope review must validate prerequisites, exclusions, corpus ownership, residency, permissions and success criteria.

Threadlight is shown as the actual shipped opinionated delivery workflow, with its documented dependencies and exclusions. Citadel is shared infrastructure. Neither replaces the customer's brief or is forced onto every workshop. Getting Started remains a practice exercise.

## Hosting limits

Deploy `dist/` exactly as before. The public site preserves catalog, demos, deep links and manual scope/specification/prompt review. AI is explicitly unavailable there. Setting a browser URL or a public `VITE_*` token is not an acceptable way to expose the local runtime.

A public/multi-user service requires a separately reviewed authenticated backend, per-user identity and isolation, authorization, retention, rate/cost controls and deployment ownership. None is provisioned here. The local service denies non-loopback origins and does not silently reach customer private-network services.

## Verification

```bash
npm test
npm run build
npm run lint
npm run workshop:smoke
```

Focused tests cover matching, typed contracts, full prompt carriage, approval invalidation, auth/output/timeouts/cancellation, cleanup and HTTP admission boundaries. Mocks in these tests are not live SDK validation. The smoke command uses the real SDK with a fictional telescope-scheduling brief and prints only counts, not generated customer content.

Browser tests use Python Playwright with non-sensitive fixtures:

```bash
python3 -m venv .workshop-ui-env
.workshop-ui-env/bin/pip install playwright
.workshop-ui-env/bin/python -m playwright install chromium
# Run npm run dev with VITE_WORKSHOP_AI=local and npm run preview on port 4173.
.workshop-ui-env/bin/python tests/workshop_ui.py
```

`WORKSHOP_UI_URL`, `WORKSHOP_STATIC_URL` and `WORKSHOP_UI_ARTIFACTS` can override the test origins/artifact directory. AI browser failure/proposal fixtures are explicitly mocked; the separate smoke proves live runtime operation. Browser tests cover desktop/mobile, theme, deep links, empty/vague/strong/partial/no-match/unsupported briefs, review/copy, stale approval, cancellations and static unavailability.

Set `WORKSHOP_LIVE_SDK=1` and run the companion alongside the dev/preview servers to enable the additional real browser-to-proxy-to-SDK journey. Its origin must be included in `WORKSHOP_ORIGINS`. This is opt-in because it uses the existing signed-in Copilot subscription.

Baseline lint currently reports existing `react-hooks/set-state-in-effect` errors in `PlaybookPage.tsx` and `SkillDetail.tsx`, plus an existing `VideoModal.tsx` dependency warning. These were reproduced against the original HEAD and are not introduced by the workshop. No rule is suppressed to hide them.

Implementation verification: **19 focused tests passed**, **eight browser journeys passed**, and **the production build passed**. The browser run included a real signed-in SDK request through the loopback HTTP companion and Vite proxy, alongside explicitly mocked failure cases. A separate live SDK smoke also passed. Static/manual review, clipboard failure visibility, deep links, themes and mobile layout were exercised. Test servers stopped and isolated analysis directories were removed afterward. The preserved approved plan matches the supplied handover byte-for-byte. Full lint remains blocked by the baseline findings above; these results do not certify production readiness.
