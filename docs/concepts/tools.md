# Tools 🧰

Source page: `/concepts/tools`

Tools are how an agent does work outside the model: search, run code, query data, call APIs, update systems, or hand work to another agent.

## Concise definition ✅

> A **tool** is a callable capability that an agent can invoke during a conversation or run to perform a specific task. The model chooses whether to call it from the agent instructions plus the available tool definitions; the tool executes in the app or service layer; the result returns to the agent as new context.

This matches the Foundry framing: [Microsoft Learn says tools let Foundry agents go beyond text generation](https://learn.microsoft.com/azure/foundry/agents/concepts/tool-catalog) by searching the web, running Python, querying documents, and calling external APIs. It also defines tools as capabilities an agent can invoke during a conversation to perform a specific task.

## Opinionated Foundry stance 🏗️

Use **[Foundry Toolboxes](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox?pivots=azd) as the preferred distribution pattern** when multiple agents need a shared, governed tool set.

Toolbox is not the only valid way to provide tools to agents. The classic pattern - attaching individual MCP servers or other tools directly to an agent - remains valid, especially when the tool is agent-specific, experimental, or owned by the same team as the agent.

Avoid wiring every shared enterprise capability directly into every agent. At scale, that creates duplicated credentials, inconsistent policy, weak discoverability, and messy ownership. For shared tools, prefer:

1. Author or register narrow tools.
2. Store credentials as Foundry project connections.
3. Curate related tools into a versioned Foundry Toolbox.
4. Expose the toolbox through one MCP-compatible endpoint.
5. Test a version-specific endpoint.
6. Promote the default version intentionally.
7. Point agents at the toolbox consumer endpoint.

## Toolbox vs individual MCP servers ⚖️

| Pattern | Best fit | Trade-off |
|---|---|---|
| **Foundry Toolbox** | Shared tools used by multiple agents, centralized auth, versioning, policy, and discovery. | Adds a managed packaging layer; changes should follow version/test/promote flow. |
| **Individual MCP server attachment** | Agent-specific tools, fast iteration, simple ownership, or direct integration with one trusted server. | Each agent owns more configuration, auth, allow-listing, and lifecycle management. |
| **AI Gateway in front of MCP** | Production MCP access that needs centralized authentication, rate limits, IP restrictions, routing, and audit logging. | Adds an API Management layer and currently has preview limitations for Foundry MCP governance. |

The practical rule: **use individual MCP servers when ownership is simple; use Toolboxes when reuse and packaging governance matter; add AI Gateway when production traffic needs centralized enforcement.**

## AI Gateway for production MCP access 🚦

For production environments, put an **[AI Gateway](https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities)** in front of externally hosted MCP servers when access needs to be centralized across teams or agents. Azure API Management's AI Gateway capabilities can govern models, agents, tools, remote MCP servers, A2A agent APIs, and self-hosted endpoints. For MCP tools, Foundry can route traffic through an AI Gateway so teams can enforce authentication, rate limits, IP restrictions, routing policy, and audit logging without changing the MCP server or agent code.

Use this pattern when:

- Multiple agents or teams call the same MCP server.
- You need central throttling, quota, IP filtering, or routing policy.
- You need consistent gateway logs and metrics for operational review.
- You want one enterprise control point between agents and external tools.

Keep the current limitations clear: [Foundry MCP governance through AI Gateway is preview](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/governance), applies to eligible MCP tools, and does not replace tool-level traces. Continue using Foundry traces and MCP server logs for tool behavior, and API Management logs/metrics for gateway traffic.

## What Foundry gives you 🔐

| Capability | Practical meaning |
|---|---|
| Built-in tools | Web search, Code Interpreter, File Search, Azure AI Search, Azure Functions, Function calling, and several preview tools such as Browser Automation, Computer Use, SharePoint, Fabric, and Image Generation. |
| Custom tools | MCP, OpenAPI, and Agent-to-Agent endpoints for capabilities you own or integrate. |
| Tool catalog | A Foundry portal surface under **Build > Tools** for discovering, configuring, and managing tools. |
| Toolbox | A curated bundle of tools exposed as a single MCP-compatible endpoint. |
| Central auth | Project connections, Microsoft Entra, managed identity, OAuth passthrough, and token handling keep credentials out of prompts and agent code. |
| Versioning | Toolbox versions let teams test a candidate endpoint before promoting it to the consumer default. |
| Structured inputs | Runtime parameters can customize supported tool properties, such as File Search vector stores or MCP server URL/headers, without creating a new agent version. |

## Tool families 🧩

| Family | What it is | Use when |
|---|---|---|
| **Web Search** | Public web grounding with citations. | Answers require fresh public information. |
| **File Search** | Retrieval over uploaded files or proprietary documents. | The agent needs private document grounding. |
| **Azure AI Search** | Retrieval over an existing Azure AI Search index. | You already operate an enterprise search index. |
| **Code Interpreter** | Sandboxed Python execution. | The task needs computation, data analysis, charts, or generated files. |
| **Azure Functions / Function calling** | Application-owned function execution. | You need custom logic with application-side control. |
| **MCP** | A remote endpoint exposing tools through Model Context Protocol. | Tools are shared across agents, IDEs, or frameworks. |
| **OpenAPI** | HTTP APIs described by OpenAPI 3.0/3.1. | You have stable REST operations with clear auth and schemas. |
| **Agent-to-Agent (A2A)** | Another agent exposed as a callable endpoint. | A specialist agent owns a complete subtask. |
| **Toolbox** | A versioned bundle of multiple tools exposed as MCP. | Multiple agents need the same governed tool set. |

The key design choice is endpoint separation:

| Endpoint type | Use it for |
|---|---|
| **Version-specific endpoint** | Testing a toolbox candidate before promotion. |
| **Consumer endpoint** | Production agents. It serves the promoted default version, so agents can pick up approved changes without code redeployment. |

> [!NOTE]
> When calling a Toolbox MCP endpoint directly, the current docs require the `Foundry-Features: Toolboxes=V1Preview` header.

## Catalog and runtime notes 🗂️

- The Foundry tool catalog and core tools framework are generally available; individual tools can still be preview, so check each tool page before production use.
- Tool availability depends on **both** model and region. If either does not support a tool, the tool cannot run for that deployment.
- Foundry Tools includes public catalog entries, organization-scoped private tool catalog entries, remote MCP servers, self-hosted MCP endpoints, and custom entries such as Logic Apps connectors converted to remote MCP servers.
- Use structured inputs for environment- or user-specific runtime values, such as a customer vector store or request-specific MCP endpoint. Do not use them to smuggle secrets through prompts.
- Before deleting a configured tool, check which agents or workflows depend on it.

## Simple `azd` shape ⚙️

The Foundry toolbox docs recommend creating connections first, then creating the toolbox from YAML. The YAML references connections by name and does not embed credentials.

```bash
azd ai project set $PROJECT_ENDPOINT

azd ai connection create my-api-conn \
  --kind remote-tool \
  --target https://api.contoso.com/mcp \
  --auth-type project-managed-identity

azd ai toolbox create agent-tools --from-file ./toolbox.yaml
```

```yaml
description: Shared tools for support agents
connections:
  - name: my-api-conn
tools:
  - type: web_search
    name: web
  - type: code_interpreter
    name: code
  - type: toolbox_search_preview
```

## Design rules 🎯

- **Prefer narrow verbs.** `get_invoice` and `refund_invoice` are better than one broad `billing` tool with a mode flag.
- **Make schemas strict.** Use required fields, enums, clear descriptions, and explicit error shapes.
- **Describe when to use the tool.** Foundry's best-practice guidance says tool instructions should explain what each tool is for and add decision rules when tools overlap.
- **Use internal retrieval first.** For enterprise content, prefer File Search or Azure AI Search before public web search.
- **Do not pass secrets through prompts.** Use project connections, managed identity, and OAuth flows.
- **Treat tool output as untrusted.** Validate critical values before writes or user-visible actions.
- **Gate risky operations.** Require approval for destructive, expensive, external, or irreversible actions.
- **Design for retries.** Mutating tools should accept idempotency keys and return stable operation IDs.
- **Trace everything.** Review traces to confirm whether the agent called a tool, which arguments it used, and why failures happened.

## Security caveat ⚠️

Connecting non-Foundry or non-Microsoft tools can send data outside Foundry's compliance boundary and may incur provider-specific costs. [Microsoft documentation explicitly warns](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol#considerations-for-using-non-microsoft-services-and-servers) that non-Microsoft services and remote MCP servers are governed by the provider's terms and data handling policies. Use trusted providers, least privilege, approval gates, and audit logging.

## Sources 📚

- [Microsoft Learn: Agent tools overview for Foundry Agent Service](https://learn.microsoft.com/azure/foundry/agents/concepts/tool-catalog)
- [Microsoft Learn: Create, test, and deploy a toolbox in Foundry](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox?pivots=azd)
- [Microsoft Learn: Connect agents to Model Context Protocol servers](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol)
- [Microsoft Learn: Tool best practices for Microsoft Foundry Agent Service](https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice)
- [Microsoft Learn: Govern MCP tools by using an AI gateway](https://learn.microsoft.com/azure/foundry/agents/how-to/tools/governance)
- [Microsoft Learn: AI gateway in Azure API Management](https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities)
- [Microsoft Learn: What is Microsoft Foundry Agent Service?](https://learn.microsoft.com/azure/foundry/agents/overview)
