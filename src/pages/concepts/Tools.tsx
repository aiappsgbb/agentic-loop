import {
  Wrench, Plug, Search, Database, Globe, ShieldCheck,
  Lightbulb, Code2, Terminal, Cpu, Webhook
} from 'lucide-react';

export default function Tools() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Tools</div>
        <h1>Tools are how agents touch the real world.</h1>
        <p className="lede">
          Tools turn an agent's intent into action — a database query, an API call, a file write, a workflow trigger. Foundry exposes a curated catalog of first-party tools (search, knowledge, code interpreter, computer use) and lets you bring your own via OpenAPI or MCP. GitHub Copilot helps you author and register them safely.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card"><div className="ic"><Search size={18} /></div><h3>Grounded retrieval</h3><p>Built-in tools for hybrid vector + keyword search across SharePoint, Fabric, Blob, and the open web.</p></div>
        <div className="feature-card"><div className="ic"><Database size={18} /></div><h3>Action on your data</h3><p>Connect Cosmos DB, Azure SQL, Microsoft Graph, and Power Platform with managed identity — no secrets in code.</p></div>
        <div className="feature-card"><div className="ic"><Globe size={18} /></div><h3>Bring your own API</h3><p>Wrap any service with an OpenAPI spec or MCP server; Foundry handles auth, retries, and rate limiting.</p></div>
        <div className="feature-card"><div className="ic"><Plug size={18} /></div><h3>Open protocols</h3><p>Speak Model Context Protocol natively so the same tool runs in Copilot, Foundry, and partner runtimes.</p></div>
        <div className="feature-card"><div className="ic"><ShieldCheck size={18} /></div><h3>Policy-gated invocation</h3><p>Every tool call is governed: schema validation, content safety, rate limits, and audit logs by default.</p></div>
        <div className="feature-card"><div className="ic"><Wrench size={18} /></div><h3>Authored with Copilot</h3><p>Describe the tool; Copilot generates the OpenAPI, the binding, the eval cases, and the deployment IaC.</p></div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Catalog</div>
        <h2>Tool families in Foundry</h2>
        <table className="compare-table">
          <thead><tr><th>Family</th><th>What it does</th><th>Typical use</th></tr></thead>
          <tbody>
            <tr><td>Knowledge</td><td>Hybrid retrieval over your enterprise indices, with ACL-aware filters and citations.</td><td>Grounded Q&A, summarization, citation-backed answers.</td></tr>
            <tr><td>Code interpreter</td><td>Sandboxed Python runtime for data analysis, charting, and file generation.</td><td>Spreadsheets, ad-hoc analytics, chart rendering.</td></tr>
            <tr><td>Computer use</td><td>Vision + action loop that drives a browser or desktop on the agent's behalf.</td><td>Legacy app automation, web research, form filling.</td></tr>
            <tr><td>OpenAPI binding</td><td>Auto-generated tool from any OpenAPI 3.x spec with managed auth.</td><td>SaaS APIs, internal services, partner integrations.</td></tr>
            <tr><td>MCP server</td><td>Connect any Model Context Protocol server — local or hosted.</td><td>Repos, dev environments, internal databases, custom apps.</td></tr>
            <tr><td>Workflow</td><td>Trigger Logic Apps, Power Automate, or your own orchestrator.</td><td>Long-running, multi-system business processes.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Author with Copilot</div>
        <h2>From idea to registered tool in 30 seconds</h2>
        <div className="code-sample">
          <div className="code-sample-head"><Terminal size={13} /> Terminal</div>
          <pre>{`# 1. Describe the tool you want
gh copilot chat "Create a Foundry tool that fetches outstanding invoices
for a customer from the billing API. Use managed identity. Add evals."

# 2. Copilot generates these files
tools/
├── get-outstanding-invoices/
│   ├── tool.yaml            # binding + auth + policies
│   ├── openapi.yaml         # generated from the API doc
│   ├── evals/golden.jsonl   # 12 happy-path + 4 edge cases
│   └── README.md

# 3. Register and test locally
az foundry tool register --file tools/get-outstanding-invoices/tool.yaml
az foundry tool test get-outstanding-invoices --case golden/1`}</pre>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy of a call</div>
        <h2>What happens when an agent invokes a tool</h2>
        <div className="phase-grid">
          <div className="phase-card"><span className="phase-num">01</span><h3>Plan</h3><p>The agent selects the tool and produces a JSON argument blob that matches the schema.</p></div>
          <div className="phase-card"><span className="phase-num">02</span><h3>Validate</h3><p>Foundry enforces the schema, content-safety checks, and per-tool rate limits before any I/O.</p></div>
          <div className="phase-card"><span className="phase-num">03</span><h3>Authenticate</h3><p>Managed identity, OBO, or API key — resolved server-side. Secrets never touch the model.</p></div>
          <div className="phase-card"><span className="phase-num">04</span><h3>Invoke</h3><p>The call goes out with retries, circuit breaking, and OpenTelemetry tracing.</p></div>
          <div className="phase-card"><span className="phase-num">05</span><h3>Govern</h3><p>The response is scanned for PII / harmful content and redacted before the agent sees it.</p></div>
          <div className="phase-card"><span className="phase-num">06</span><h3>Trace</h3><p>Inputs, outputs, latency, cost, and policy verdicts land in the Foundry trace store.</p></div>
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>Tools are where reliability is won or lost</h3>
          <p>Most agent failures aren't reasoning failures — they're tool-shaped: bad arguments, missing scopes, brittle schemas, silent retries. Treat the tool layer as your highest-leverage investment.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Patterns we love</div>
        <h2>How great teams design tools</h2>
        <div className="feature-grid">
          <div className="feature-card"><div className="ic"><Cpu size={18} /></div><h3>Narrow verbs</h3><p>One verb per tool. <code>get_invoice</code> and <code>refund_invoice</code> beat one <code>billing</code> tool with a mode flag.</p></div>
          <div className="feature-card"><div className="ic"><Code2 size={18} /></div><h3>Schema-first</h3><p>Write the schema before the implementation; the agent's reliability tracks the strictness of its types.</p></div>
          <div className="feature-card"><div className="ic"><Webhook size={18} /></div><h3>Idempotent by default</h3><p>Agents retry. Tools should make retries safe — accept idempotency keys, return stable IDs.</p></div>
        </div>
      </section>
    </>
  );
}
