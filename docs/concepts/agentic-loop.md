# The Agentic Loop

Powered by GitHub Copilot SDK - the same agent runtime behind Copilot CLI.

The Agentic Loop describes how an agent turns a natural-language request into a streamed response without requiring manual orchestration. The agent reasons about the request, decides what context it needs, acts through SKILLs and tools, observes the result, and loops until it has enough information to answer.

## How this maps to the GitHub Copilot SDK

The GitHub Copilot SDK is the programmable surface for this loop. Your application creates a Copilot session and sends a prompt; the SDK transports that prompt to Copilot CLI over JSON-RPC; Copilot CLI runs the agentic tool-use loop; the SDK streams events and results back to your application.

```mermaid
flowchart LR
  app[Your app<br/>chat, CLI, IDE, workflow]
  sdk[GitHub Copilot SDK<br/>session API, events, permissions]
  cli[Copilot CLI<br/>agent loop orchestrator]
  model[Model<br/>decides next turn]
  tools[Tools, MCP servers,<br/>files, shell, APIs]

  app -->|session.send or sendAndWait| sdk
  sdk -->|JSON-RPC| cli
  cli -->|conversation history| model
  model -->|tool requests or final text| cli
  cli -->|execute requested tools| tools
  tools -->|results as new context| cli
  cli -->|session events + response| sdk
  sdk -->|streamed updates| app
```

The SDK itself is not a separate planner. It gives your app control over sessions, permissions, events, SKILL directories, MCP servers, custom agents, and streaming. The loop is run by Copilot CLI: each turn sends the accumulated conversation context to the model, the model decides whether to request tools or answer, and the CLI executes requested tools before feeding the results into the next turn. Each iteration is visible as a session turn; when no more tool calls are needed, the session becomes idle.

This is why the Agentic Loop and the GitHub Copilot SDK line up directly:

- **Prompt in**: your app calls `session.send(...)` or `session.sendAndWait(...)`.
- **Reason**: Copilot CLI sends the current conversation context to the model for one turn.
- **Act**: if the model asks for tools, the CLI invokes first-party tools, custom tools, or MCP-provided tools, subject to the SDK permission handler.
- **Observe**: tool results are appended to the session context and streamed as events.
- **Loop**: the CLI starts another turn if the model needs more information.
- **Complete**: when no more tool requests are needed, the model returns final text and the session becomes idle.

```mermaid
flowchart LR
  prompt[User prompt<br/>Natural language task or question]
  context[Context sources<br/>Conversation, files, memory,<br/>knowledge, state, telemetry]
  skills[SKILL catalog<br/>Reusable instructions,<br/>tool bundles, schemas, evals]
  reason[1. Reason<br/>Gather context<br/><br/>Analyze prompt + history<br/>Decide what context is missing<br/>Select SKILLs and tools<br/>Form execution plan]
  act[2. Act<br/>Execute SKILL-guided tool call<br/><br/>Invoke custom or MCP tool<br/>Search, API, code generation,<br/>file operations, shell command<br/>Stream partial results]
  observe[3. Observe<br/>Decide<br/><br/>Parse tool output<br/>Auto-compact context<br/>Enough? respond<br/>Need more? loop back]
  response[Streamed response<br/>Final answer streamed back to the user]

  prompt --> reason --> act --> observe --> response
  context -. pulled as needed .-> reason
  skills -. selected as needed .-> reason
  skills -. invoked by .-> act
  observe -- More information needed --> reason
```

## 1. Reason: gather context

The agent first interprets the user's task in context. Context is not a one-time input; it is something the agent actively manages across the loop. At each iteration, the agent asks: "Do I have enough context to act or answer safely, or do I need to retrieve more?"

- Analyze the prompt and conversation history.
- Load relevant files, state, memory, or external context.
- Decide which SKILLs and tools may be needed.
- Form an execution plan before acting.

Useful context can come from several places:

- Conversation history and current user intent.
- Workspace files, repository state, terminal output, or application state.
- Long-term memory, prior decisions, or saved plans.
- Knowledge stores, search indexes, documentation, or external APIs.
- Observability signals such as traces, logs, eval failures, and telemetry.

The loop works because the agent can defer judgment until it has gathered the right context. If the first action reveals ambiguity, missing facts, a failed tool call, or a partial result, the agent folds that observation back into context and reasons again.

## Where SKILLs fit

SKILLs are reusable capability bundles the agent can pull into the loop when the task calls for specialized behavior. A SKILL can contribute instructions, prompts, schemas, tool bindings, examples, evals, and guardrails. In the loop, SKILLs sit between reasoning and action:

- During reasoning, the agent decides whether a SKILL is relevant to the user's intent.
- During action, the agent invokes the SKILL's tools, prompts, or workflow.
- During observation, the agent evaluates the SKILL output and decides whether more context or another SKILL is needed.
- Across iterations, the agent can chain SKILLs together while preserving the task context.

This keeps the loop modular. The base agent does not need to know every domain deeply; it needs to know when to retrieve context, when to reuse a SKILL, and when the observed result is good enough to continue or answer.

In GitHub Copilot SDK terms, SKILLs are loaded from directories that contain `SKILL.md` files. Their markdown instructions are injected into session context, so the model can use them while reasoning. A SKILL can also document required MCP servers or tools; those tools become available to the action phase when configured on the SDK session.

## 2. Act: execute tool calls

The agent then performs concrete work through SKILLs and tools.

- Invoke MCP tools, custom tools, or SKILL-guided workflows.
- Search, call APIs, generate code, edit files, or run shell commands.
- Stream partial progress or intermediate results where useful.

## 3. Observe: decide what comes next

After each action, the agent inspects the output and decides whether the task is complete.

- Parse tool output.
- Compact and update context.
- Decide whether the current context is sufficient.
- Pull in more context, invoke another SKILL, or retry with a refined plan if needed.
- If there is enough information, produce the final response.
- If more information is needed, loop back to reasoning and continue autonomously.

## Core principle

The loop continues autonomously until the agent has enough information to answer. The user provides intent; the agent handles context gathering, SKILL selection, tool execution, observation, and iteration.

## References

- [GitHub Copilot SDK README](https://github.com/github/copilot-sdk) - SDK overview, architecture, and relationship to Copilot CLI.
- [GitHub Copilot SDK: The agent loop](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) - turns, tool requests, session events, and completion signals.
- [GitHub Copilot SDK: Skills](https://github.com/github/copilot-sdk/blob/main/docs/features/skills.md) - loading `SKILL.md` modules into session context.
- [GitHub Copilot SDK: MCP servers](https://github.com/github/copilot-sdk/blob/main/docs/features/mcp.md) - adding external tool providers to a session.
