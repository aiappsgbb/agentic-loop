# Hosted integration checkpoint

Read for architecture, the first hosted deployment, and changed identity/endpoint integrations. Prove the hosted boundary before expanding orchestration or implementing the full application. This is an acceptance gate, not a replacement for `microsoft-foundry` platform workflows.

## Endpoint contract

Record these distinct values in the root README contract and persist discovered values in the applicable deployment configuration and Git-ignored `.env`. Record their source, authentication audience, consuming component and version. Unknown values remain pending until discovery; do not synthesize endpoints from display names.

| Application variable | Meaning and validation |
| --- | --- |
| `APP_FOUNDRY_PROJECT_ENDPOINT` | Full project URL including `/api/projects/<project>`, returned by project discovery. Used by project clients. |
| `MODEL_API_BASE_URL` | Actual model-hosting account's OpenAI-compatible base ending in `/openai/v1/`. Used by the model provider; it is not the project or hosted-agent URL. Record model deployment name separately. |
| `HOSTED_RESPONSES_ENDPOINT` | Deployed agent's actual Responses request URL, including required API version and agent routing. Record the agent version used by the probe; distinguish this complete request URL from an SDK base URL that appends `/responses`. |
| `TOOLBOX_MCP_ENDPOINT` | Discovered toolbox MCP URL, including API version. Record toolbox name, selected version and whether the URL follows the default version or pins an immutable version. |

Keep `FOUNDRY_PROJECT` as the project **ARM ID**, not an endpoint. Keep platform-owned `FOUNDRY_*` variables untouched. A reported build had its custom `FOUNDRY_PROJECT_ENDPOINT` overwritten with an account-only URL; use `APP_FOUNDRY_PROJECT_ENDPOINT` for the application's verified full URL, explicitly pass it to project clients, and validate its path at startup. Do not silently append guessed project names or fall back to the reserved value. Verify how current adapters consume platform configuration through `microsoft-foundry`.

## Minimal deployment and identity

1. Reuse the Basic sample, agreed framework and model deployment. Implement one deterministic, read-only probe requiring one toolbox skill load, one MCP tool call and a model response using their results. Keep full UI, backend and multi-agent orchestration out of this slice. Explicitly out-of-scope capabilities need a recorded reason; mocks or skipped checks cannot pass a required boundary.
2. Deploy only the necessary MCP dependency and toolbox skill/version, then code-deploy the agent. Confirm approval for billable operations. Provisioning or `active` only enables the probe; it does not pass it.
3. Discover the deployed agent's **actual principal/object ID** from deployment/identity metadata. A new principal cannot be checked before creation. Distinguish object ID from client/application ID and the agent resource ID. Record tenant, agent/version, principal, resource scope and required operation/role.
4. Verify effective grants (including inheritance/conditions) and actual data-plane access. Use the following reported-build combinations as checks, not unconditional grants to every solution. Resolve current roles and least-privilege scope through `microsoft-foundry`.

| Principal | Resource scope | Role to verify when this path requires it |
| --- | --- | --- |
| Deployed agent identity | Foundry project | Foundry User for explicit project/toolbox access; account for platform-provided access and current role definitions. |
| Deployed agent identity | Account actually hosting the model | Cognitive Services OpenAI User for direct account-level OpenAI inference. Project access alone does not establish this. |
| Identity directly emitting authenticated Application Insights telemetry | Application Insights component | Monitoring Metrics Publisher. Verify the deployed agent principal when it is the emitter; do not substitute the deployer's grant. |
| Collector identity for native Azure Monitor OTLP ingestion, when used | Destination Data Collection Rule (DCR) | Monitoring Metrics Publisher. Verify the collector's actual principal, which can differ from the agent; do not add this route or grant when unused. |

Keep the deployer, project managed identity, agent identity, runtime caller and **toolbox connection identity** separate. Agent-to-toolbox access and connection-to-downstream MCP/service access are different checks. Confirm the configured connection auth mode and its principal/resource permissions; an agent grant cannot repair the wrong downstream identity.

Invoke the deployed endpoint with an authorized caller, but ensure downstream model/toolbox operations use the hosted workload credential and platform caller context. A developer token can authorize the external probe; it must not replace the agent's internal credential. No copied `az login` tokens or secret-key fallback to make the checkpoint pass.

## Probes and pass criteria

- Run a minimal direct model Responses request and toolbox skill/tool probe **inside the hosted identity/context path**, then run the equivalent SDK-mediated agent request. Record the actual skill version loaded and MCP tool name/call result using SDK/tool events or safe correlated telemetry, not the model's claim that it used them.
- Exercise JSON and SSE using the actual returned content type. For SSE, consume through `response.completed`; EOF, `[DONE]`, text deltas, `session.idle` or a stopped spinner alone are insufficient. For nonstreaming JSON, require a final response object with `status: "completed"`; queued/in-progress responses require bounded polling. Also prove the streaming terminal event when streaming is supported.
- Treat `response.failed`, `response.incomplete`, cancellation, timeout, protocol errors and embedded error payloads as failures, even with HTTP 200 or CLI exit code zero. A CLI wrapper must parse the response and return failure for unsuccessful terminal status.
- Require nonempty, schema-valid application output with expected probe values and evidence of every required skill/tool/model operation. Reject absent upstream fields explicitly; do not turn missing results into empty success.
- Correlate application request ID, response ID, hosted session ID, SDK session/turn ID, agent version and service request IDs. Save a concise checkpoint record and evidence locations in the README. Missing evidence leaves the gate blocked; label unavailable IDs as such, never invent them.
- Require the deployed probe's hosting-request, model-request and required tool-execution spans to arrive in the configured telemetry destination, without enabling sensitive prompt/completion/tool-content capture. Verify trace/parent relationships and agent/version identification using the destination's actual schema. For Copilot SDK, configure both producers through the [telemetry recipe](copilot-sdk-foundry.md#telemetry). A project connection, exporter startup message or hosting-request span alone is insufficient. Allow bounded ingestion delay; missing required spans leave the checkpoint incomplete. Only after the required checks pass may full application work begin.

## Diagnostic decision tree

| Failure | Next bounded action |
| --- | --- |
| Import, startup or dependency resolution | Capture exact Python, SDK, hosting adapter and running Copilot runtime versions. Check installed signatures and package/runtime compatibility. For remote-resolution failures use the conditional [packaging fallback](copilot-sdk-foundry.md#dependency-packaging-fallback), not a framework rewrite. |
| 401 | Compare endpoint/base path, expected token audience, refresh callback and forwarded platform context for direct versus SDK requests **under the same deployed identity**. Log no tokens or caller-context header values. |
| 403 | Check actual principal/resource/role combinations and toolbox downstream identity separately. After a confirmed role change, retry the minimal probe with backoff and a fixed deadline (for example five attempts within five minutes). Refresh credentials through the supported provider; do not repeatedly redeploy identical code. |
| Developer probe passes, hosted probe fails | Compare the actual identities, network access, full project URL, model account and platform caller context. Developer success is not hosted proof. Do not disable network isolation to bypass a failure. |
| Direct hosted request passes, SDK fails | Compare sanitized method, route, deployment name, API version, audience, header **names**, content type and payload schema. Check adapter/SDK/runtime signatures before changing RBAC. |
| HTTP success but failed/missing output | Inspect response ID, final status, structured error and matching service request IDs. Parse JSON/SSE correctly; never reinterpret transport success as agent success. |
| Intermittent failures under load | Check request-local context, response-ID matching, session isolation, token refresh, cancellation and atomic tool-budget reservation before async work. |
| Missing or host-only telemetry | Check host and runtime producer configuration separately, active trace context, receiver/export route, destination/schema, actual exporter identity permissions, sampling and lifecycle flush. Allow bounded ingestion delay; do not pass the gate or repeatedly redeploy unchanged code. |

Log safe structured diagnostics: application correlation ID, response ID, hosted and SDK session IDs, agent name/version, available service request IDs, SDK/runtime versions, status/error code and sanitized error summary. Capture response headers such as `x-agent-session-id` on failures too. Exclude Authorization, cookies, tokens, opaque caller-context values, `.env` dumps and sensitive bodies.

Retry only transient failures within a declared attempt/deadline budget; do not blindly replay non-idempotent tool calls. Redeploy only for changed code, dependencies or deployment configuration. Track debug processes and hosted/SDK sessions created by this task; stop only those temporary resources afterward. Preserve the user's sessions and the local app servers required by the acceptance handoff.

## Contract tests

Add targeted tests before expanding each boundary, then run the applicable full-app cases at local acceptance:

- Missing/null upstream IDs, output, tool results or schema fields produce explicit errors.
- JSON and SSE success, embedded errors, incomplete status, truncated streams and timeouts produce correct terminal state and error rendering.
- Concurrent/interleaved requests map events and results to their own response/request/session IDs; a late result cannot resolve another request or overwrite its persisted state.
- Reserve tool-call limits atomically **before** dispatch/await; simultaneous calls cannot exceed the cap. Test the boundary and rejected calls, including failure/cancellation accounting.
- Token expiry/refresh and per-request context reach both model and toolbox without cross-user/session leakage.
- Concurrent hosted requests retain separate trace/parent associations through runtime and tool callbacks. Check content-capture defaults, graceful flush and explicit export failures; local mocks do not replace deployed span-ingestion evidence.
- App failures render clearly; retry, persistence/reload and export preserve validated results and failure state without secrets. Exercise mobile layout and keyboard navigation/focus as well as the happy path.

## Platform sources

Resolve commands and changing platform contracts through the installed `microsoft-foundry` skill. References checked on 2026-09-22:

- [Hosted agent permissions](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agent-permissions)
- [Hosted runtime contract](https://learn.microsoft.com/azure/foundry/agents/concepts/hosted-agent-contract)
- [Toolbox authentication and hosted integration](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/use-toolbox-hosted-agent)
- [Source-code deployment](https://learn.microsoft.com/azure/foundry/agents/how-to/deploy-hosted-agent-code)
