import { Link } from 'react-router-dom';
import {
  Wrench, Plug, Search, Database, ShieldCheck,
  Lightbulb, Code2, Terminal, Cpu, Webhook, Boxes,
  BookOpen, GitBranch, Activity, Network, AlertTriangle,
} from 'lucide-react';

const CORE_IDEAS = [
  {
    icon: <Wrench size={18} />,
    title: 'Callable capability',
    text: 'A tool is something the agent can invoke during a run: search, run code, query data, call an API, or hand work to another agent.',
  },
  {
    icon: <Code2 size={18} />,
    title: 'Model chooses, app executes',
    text: 'The model decides whether to call a tool from the instructions and tool definitions; the tool runs in the app or service layer.',
  },
  {
    icon: <Plug size={18} />,
    title: 'Result returns as context',
    text: 'The tool result returns to the agent as new context, feeding the next decision in the loop.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Governed execution',
    text: 'Authentication, approval, data handling, logging, and policy matter more than the adapter shape.',
  },
];

const DISTRIBUTION: [string, string, string][] = [
  ['Foundry Toolbox', 'Shared tools used by multiple agents, with centralized auth, versioning, policy, and discovery.', 'Adds a managed packaging layer; changes should follow the version, test, promote flow.'],
  ['Individual MCP server', 'Agent-specific tools, fast iteration, simple ownership, or direct integration with one trusted server.', 'Each agent owns more configuration, auth, allow-listing, and lifecycle management.'],
  ['AI Gateway in front of MCP', 'Production MCP access needing centralized auth, rate limits, IP restrictions, routing, and audit logging.', 'Adds an API Management layer; Foundry MCP governance is currently in preview.'],
];

const FOUNDRY_CAPABILITIES: [string, string][] = [
  ['Built-in tools', 'Web Search, Code Interpreter, File Search, Azure AI Search, Azure Functions, and function calling, plus preview tools such as Browser Automation, Computer Use, SharePoint, Fabric, and Image Generation.'],
  ['Custom tools', 'MCP, OpenAPI, and Agent-to-Agent endpoints for capabilities you own or integrate.'],
  ['Tool catalog', 'A Foundry portal surface under Build > Tools for discovering, configuring, and managing tools.'],
  ['Toolbox', 'A curated bundle of tools exposed as a single MCP-compatible endpoint.'],
  ['Central auth', 'Project connections, Microsoft Entra, managed identity, and OAuth passthrough keep credentials out of prompts and agent code.'],
  ['Versioning', 'Toolbox versions let teams test a candidate endpoint before promoting it to the consumer default.'],
  ['Structured inputs', 'Runtime parameters customize supported tool properties without creating a new agent version.'],
];

const TOOL_FAMILIES: [string, string, string][] = [
  ['Web Search', 'Public web grounding with citations.', 'Answers require fresh public information.'],
  ['File Search', 'Retrieval over uploaded files or proprietary documents.', 'The agent needs private document grounding.'],
  ['Azure AI Search', 'Retrieval over an existing Azure AI Search index.', 'You already operate an enterprise search index.'],
  ['Code Interpreter', 'Sandboxed Python execution.', 'The task needs computation, analysis, charts, or files.'],
  ['Azure Functions / Function calling', 'Application-owned function execution.', 'You need custom logic with application-side control.'],
  ['MCP', 'A remote endpoint exposing tools through Model Context Protocol.', 'Tools are shared across agents, IDEs, or frameworks.'],
  ['OpenAPI', 'HTTP APIs described by OpenAPI 3.0/3.1.', 'You have stable REST operations with clear auth and schemas.'],
  ['Agent-to-Agent (A2A)', 'Another agent exposed as a callable endpoint.', 'A specialist agent owns a complete subtask.'],
  ['Toolbox', 'A versioned bundle of tools exposed as MCP.', 'Multiple agents need the same governed tool set.'],
];

const TOOLBOX_FLOW = [
  { icon: <Database size={18} />, step: '01', title: 'Register connections', text: 'Store credentials as Foundry project connections. The YAML references connections by name and embeds no secrets.' },
  { icon: <Boxes size={18} />, step: '02', title: 'Create toolbox version', text: 'Curate built-in tools, MCP servers, OpenAPI tools, and A2A tools into a versioned bundle exposed as one MCP endpoint.' },
  { icon: <Search size={18} />, step: '03', title: 'Validate endpoint', text: 'Test the version-specific MCP endpoint before promotion. Check tools/list, schemas, and at least one tools/call.' },
  { icon: <GitBranch size={18} />, step: '04', title: 'Promote intentionally', text: 'Point agents at the consumer endpoint so they pick up the promoted default version without code changes.' },
  { icon: <Activity size={18} />, step: '05', title: 'Observe usage', text: 'Review traces for tool choice, arguments, output quality, latency, errors, and data exposure.' },
];

const DESIGN_RULES = [
  { icon: <Cpu size={18} />, title: 'Prefer narrow verbs', text: 'get_invoice and refund_invoice beat one billing tool with a mode flag.' },
  { icon: <Code2 size={18} />, title: 'Make schemas strict', text: 'Use required fields, enums, clear descriptions, and explicit error shapes.' },
  { icon: <BookOpen size={18} />, title: 'Describe when to use it', text: 'Tool instructions should explain intent and add decision rules when tools overlap.' },
  { icon: <Search size={18} />, title: 'Use internal retrieval first', text: 'Prefer File Search or Azure AI Search before public web search for enterprise content.' },
  { icon: <ShieldCheck size={18} />, title: 'Keep secrets out of prompts', text: 'Use project connections, managed identity, and OAuth flows, never prompt-passed secrets.' },
  { icon: <Webhook size={18} />, title: 'Design for retries', text: 'Mutating tools should accept idempotency keys and return stable operation IDs.' },
];

const SOURCES: [string, string][] = [
  ['Microsoft Learn - Agent tools overview', 'https://learn.microsoft.com/azure/foundry/agents/concepts/tool-catalog'],
  ['Microsoft Learn - Create, test, and deploy a toolbox in Foundry', 'https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox?pivots=azd'],
  ['Microsoft Learn - Connect agents to MCP servers', 'https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol'],
  ['Microsoft Learn - Tool best practices', 'https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice'],
  ['Microsoft Learn - Govern MCP tools with an AI gateway', 'https://learn.microsoft.com/azure/foundry/agents/how-to/tools/governance'],
  ['Microsoft Learn - AI gateway in Azure API Management', 'https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities'],
  ['Microsoft Learn - Foundry Agent Service overview', 'https://learn.microsoft.com/azure/foundry/agents/overview'],
];

export default function Tools() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Tools</div>
        <h1>Tools are how agents do work outside the model.</h1>
        <p className="lede">
          A tool is a callable capability that an <Link to="/concepts/agents">agent</Link> can invoke during a run
          to perform a specific task. The model chooses whether to call it from the instructions plus the available
          tool definitions; the tool executes in the app or service layer; the result returns to the agent as new context.
        </p>
      </div>

      <div className="feature-grid">
        {CORE_IDEAS.map(item => (
          <div className="feature-card" key={item.title}>
            <div className="ic">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>Opinionated Foundry stance: prefer Toolboxes for shared tools</h3>
          <p>
            Use{' '}
            <a href="https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox?pivots=azd" target="_blank" rel="noreferrer">Foundry Toolboxes</a>{' '}
            as the preferred distribution pattern when multiple agents need a shared, governed tool set. Toolbox is not the
            only valid option: attaching individual MCP servers directly to an agent remains valid when the tool is
            agent-specific, experimental, or owned by the same team. Avoid wiring every shared enterprise capability into
            every agent: at scale that creates duplicated credentials, inconsistent policy, weak discoverability, and messy ownership.
          </p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Distribution patterns</div>
        <h2>Toolbox vs individual MCP vs AI Gateway</h2>
        <p className="lede">
          These patterns are complementary, not exclusive. Use individual MCP servers when ownership is simple, use
          Toolboxes when reuse and packaging governance matter, and add an AI Gateway when production traffic needs
          centralized enforcement.
        </p>
        <table className="compare-table">
          <thead><tr><th>Pattern</th><th>Best fit</th><th>Trade-off</th></tr></thead>
          <tbody>
            {DISTRIBUTION.map(([pattern, fit, trade]) => (
              <tr key={pattern}>
                <td><strong>{pattern}</strong></td>
                <td>{fit}</td>
                <td>{trade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">AI Gateway</div>
        <h2>Centralize production MCP access without rewriting tools.</h2>
        <p className="lede">
          For production, put an{' '}
          <a href="https://learn.microsoft.com/azure/api-management/genai-gateway-capabilities" target="_blank" rel="noreferrer">AI Gateway</a>{' '}
          in front of externally hosted MCP servers when access needs to be centralized across teams or agents. Azure API
          Management can govern models, agents, tools, remote MCP servers, and A2A APIs. Foundry can route MCP traffic
          through the gateway so teams enforce auth, rate limits, IP restrictions, routing, and audit logging without
          changing the MCP server or agent code. It complements Toolboxes and direct MCP; it does not replace them.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="ic"><Network size={18} /></div>
            <h3>Use it when</h3>
            <p>Multiple agents or teams call the same MCP server, or you need central throttling, quota, IP filtering, or routing policy.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><Activity size={18} /></div>
            <h3>What you get</h3>
            <p>Consistent gateway logs and metrics, plus one enterprise control point between agents and external tools.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><AlertTriangle size={18} /></div>
            <h3>Current limits</h3>
            <p>
              <a href="https://learn.microsoft.com/azure/foundry/agents/how-to/tools/governance" target="_blank" rel="noreferrer">Foundry MCP governance via AI Gateway is preview</a>,
              applies to eligible MCP tools, and does not replace tool-level traces.
            </p>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Foundry capabilities</div>
        <h2>What Foundry gives you.</h2>
        <table className="compare-table">
          <thead><tr><th>Capability</th><th>Practical meaning</th></tr></thead>
          <tbody>
            {FOUNDRY_CAPABILITIES.map(([cap, meaning]) => (
              <tr key={cap}>
                <td><strong>{cap}</strong></td>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Catalog</div>
        <h2>Tool families in Foundry.</h2>
        <p className="lede">
          Foundry splits tools into built-in tools, custom tools, and Toolboxes. The tool catalog and core tools
          framework are generally available, while some individual tools remain preview.
        </p>
        <table className="compare-table">
          <thead><tr><th>Family</th><th>What it is</th><th>Use when</th></tr></thead>
          <tbody>
            {TOOL_FAMILIES.map(([family, what, use]) => (
              <tr key={family}>
                <td><strong>{family}</strong></td>
                <td>{what}</td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Foundry Toolbox</div>
        <h2>Package the tool layer like a governed dependency.</h2>
        <p className="lede">
          A Toolbox is a curated bundle of tools exposed through a single MCP-compatible endpoint. Foundry manages
          credential injection, token refresh, and policy enforcement for the bundle, so consuming agents need no
          per-tool credential logic. The key design choice is endpoint separation: a version-specific endpoint for
          testing a candidate, and a consumer endpoint for production agents.
        </p>
        <div className="phase-grid">
          {TOOLBOX_FLOW.map(item => (
            <div className="phase-card" key={item.step}>
              <span className="phase-num">{item.step}</span>
              <div className="ic">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Runtime notes</div>
        <h2>Catalog and runtime caveats.</h2>
        <ul>
          <li>Tool availability depends on <strong>both</strong> model and region. If either does not support a tool, it cannot run for that deployment.</li>
          <li>Foundry Tools spans public catalog entries, organization-scoped private entries, remote and self-hosted MCP endpoints, and custom entries such as Logic Apps connectors converted to remote MCP servers.</li>
          <li>Use structured inputs for environment- or user-specific runtime values, such as a customer vector store or request-specific MCP endpoint. Do not use them to smuggle secrets through prompts.</li>
          <li>When calling a Toolbox MCP endpoint directly, the current docs require the <code>Foundry-Features: Toolboxes=V1Preview</code> header.</li>
          <li>Before deleting a configured tool, check which agents or workflows depend on it.</li>
        </ul>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">azd shape</div>
        <h2>Keep the implementation boring.</h2>
        <p className="lede">
          Create connections first, then create the toolbox from YAML. The YAML references connections by name and
          embeds no credentials.
        </p>
        <div className="code-sample">
          <div className="code-sample-head"><Terminal size={13} /> toolbox.yaml</div>
          <pre>{`# 1. Create one Foundry project connection per external credential.
azd ai project set $PROJECT_ENDPOINT
azd ai connection create my-api-conn \\
  --kind remote-tool \\
  --target https://api.contoso.com/mcp \\
  --auth-type project-managed-identity

# 2. Create a toolbox from a credential-free YAML file.
azd ai toolbox create agent-tools --from-file ./toolbox.yaml

# toolbox.yaml
description: Shared tools for support agents
connections:
  - name: my-api-conn
tools:
  - type: web_search
    name: web
  - type: code_interpreter
    name: code
  - type: toolbox_search_preview`}</pre>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Design rules</div>
        <h2>Good tools are boring, typed, and auditable.</h2>
        <div className="feature-grid">
          {DESIGN_RULES.map(item => (
            <div className="feature-card" key={item.title}>
              <div className="ic">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="callout">
        <div className="ic"><AlertTriangle size={20} /></div>
        <div>
          <h3>Security caveat: tools can cross the compliance boundary</h3>
          <p>
            Connecting non-Foundry or non-Microsoft tools can send data outside Foundry's compliance boundary and may
            incur provider-specific costs.{' '}
            <a href="https://learn.microsoft.com/azure/foundry/agents/how-to/tools/model-context-protocol#considerations-for-using-non-microsoft-services-and-servers" target="_blank" rel="noreferrer">Microsoft documentation explicitly warns</a>{' '}
            that non-Microsoft services and remote MCP servers are governed by the provider's terms and data handling
            policies. Treat tool output as untrusted, use trusted providers, least privilege, approval gates, and audit logging.
          </p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Sources</div>
        <h2>References</h2>
        <p className="lede">
          The dedicated Markdown note for this page is in <code>docs/concepts/tools.md</code>.
        </p>
        <table className="compare-table">
          <thead><tr><th>Source</th><th>Link</th></tr></thead>
          <tbody>
            {SOURCES.map(([label, href]) => (
              <tr key={href}>
                <td><BookOpen size={14} /> {label}</td>
                <td><a href={href} target="_blank" rel="noreferrer">{href}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
