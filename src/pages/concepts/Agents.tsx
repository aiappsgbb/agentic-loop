import {
  Bot, Brain, GitBranch, MessagesSquare, ShieldCheck, Network,
  Boxes, Layers, Workflow, Lightbulb, Code2
} from 'lucide-react';

export default function Agents() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Agents</div>
        <h1>Agents are reasoning systems that act on your behalf.</h1>
        <p className="lede">
          A Foundry agent is more than a prompt and a model — it's a hosted runtime that combines a frontier LLM, a curated set of <strong>skills</strong> and <strong>tools</strong>, grounded knowledge, identity, governance policies, and persistent memory. With GitHub Copilot you compose them like building blocks; with Microsoft Foundry you run them with enterprise SLAs.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="ic"><Brain size={18} /></div>
          <h3>Frontier reasoning</h3>
          <p>Choose from the Foundry model catalog — GPT, Claude, Llama, Phi, Mistral — and swap models without rewriting your agent.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><GitBranch size={18} /></div>
          <h3>Multi-agent topologies</h3>
          <p>Compose planners, executors, and critics. Agents call agents via typed contracts and shared memory.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><MessagesSquare size={18} /></div>
          <h3>Stateful conversations</h3>
          <p>Threads, sessions, and long-term memory are first-class — including human-in-the-loop hand-offs.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><ShieldCheck size={18} /></div>
          <h3>Governed by design</h3>
          <p>Identity via Entra, content safety, prompt shields, and policy enforcement at every tool call.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><Network size={18} /></div>
          <h3>Private by default</h3>
          <p>Deploy inside your VNet with private endpoints — your data and prompts never leave your perimeter.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><Bot size={18} /></div>
          <h3>Open standards</h3>
          <p>Speak MCP, OpenAPI, and OpenTelemetry so your agents interoperate with the broader ecosystem.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy</div>
        <h2>What's inside a Foundry agent</h2>
        <p className="lede">An agent is a declarative bundle. Everything below is versioned, reviewable, and reproducible.</p>
        <div className="phase-grid">
          <div className="phase-card"><span className="phase-num">Brain</span><h3>Model + system prompt</h3><p>The reasoning engine and the role description that shapes how it thinks.</p></div>
          <div className="phase-card"><span className="phase-num">Hands</span><h3>Tools</h3><p>Typed functions the agent can invoke — APIs, databases, code interpreter, computer use.</p></div>
          <div className="phase-card"><span className="phase-num">Toolbox</span><h3>Skills</h3><p>Reusable bundles of prompts, tools, and evals that encapsulate a capability.</p></div>
          <div className="phase-card"><span className="phase-num">Memory</span><h3>Threads + recall</h3><p>Short-term conversation state plus optional long-term semantic recall.</p></div>
          <div className="phase-card"><span className="phase-num">Knowledge</span><h3>Grounding</h3><p>Connected indices over your enterprise data with ACL-aware retrieval.</p></div>
          <div className="phase-card"><span className="phase-num">Guardrails</span><h3>Policies</h3><p>Content safety, prompt shields, redaction, allow/deny lists — enforced server-side.</p></div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Topologies</div>
        <h2>From single agents to crews</h2>
        <table className="compare-table">
          <thead><tr><th>Pattern</th><th>When to use it</th><th>Trade-off</th></tr></thead>
          <tbody>
            <tr><td>Single agent</td><td>Focused tasks with a clear input/output contract.</td><td>Simple to reason about; limited by one context window.</td></tr>
            <tr><td>Planner / executor</td><td>Long-horizon tasks needing decomposition before action.</td><td>More tokens, but dramatically better reliability on complex jobs.</td></tr>
            <tr><td>Crew (specialists)</td><td>Multi-domain problems — research + design + code.</td><td>Hand-offs must be governed to avoid context drift.</td></tr>
            <tr><td>Reflexion / critic</td><td>High-stakes outputs that benefit from self-review.</td><td>Higher latency and cost; ideal for offline or batch flows.</td></tr>
            <tr><td>Human-in-the-loop</td><td>Regulated or irreversible actions.</td><td>Throughput limited by reviewer bandwidth — design for queueing.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Example</div>
        <h2>A minimal agent.yaml</h2>
        <div className="code-sample">
          <div className="code-sample-head"><Code2 size={13} /> agent.yaml</div>
          <pre>{`name: billing-copilot
model: gpt-5
description: Helps support agents resolve billing issues with policy-grounded answers.

skills:
  - skills/answer-billing-question@1.4
  - skills/issue-refund@2.0
  - skills/escalate-to-human@1.0

tools:
  - tool: billing-api          # OpenAPI binding
    auth: managed-identity
  - tool: knowledge-search     # First-party Foundry tool
    index: billing-docs

memory:
  thread: true
  long_term:
    store: cosmos
    embedding: text-embedding-3-large

policies:
  content_safety: strict
  prompt_shield: enabled
  pii_redaction: [email, phone, cc]

evaluation:
  golden_set: evals/billing-golden.jsonl
  judges: [groundedness, helpfulness, safety]`}</pre>
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>Treat the agent like a service, not a script</h3>
          <p>Version it, evaluate it, observe it, and govern it as you would any production API. The Agentic Loop assumes this discipline — and rewards it.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Patterns we love</div>
        <h2>Battle-tested ideas</h2>
        <div className="feature-grid">
          <div className="feature-card"><div className="ic"><Workflow size={18} /></div><h3>Plan, act, reflect</h3><p>A three-beat loop: plan in JSON, execute steps, then critique results before responding.</p></div>
          <div className="feature-card"><div className="ic"><Layers size={18} /></div><h3>Skills as APIs</h3><p>Design skills with strict input / output schemas — agents compose them without surprises.</p></div>
          <div className="feature-card"><div className="ic"><Boxes size={18} /></div><h3>Cheap router, smart worker</h3><p>Use a small model to classify intent and a frontier model only where it earns its cost.</p></div>
        </div>
      </section>
    </>
  );
}
