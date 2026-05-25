import { Code as Github, Cloud, ArrowRight, Code2, Rocket, Eye, RefreshCw,
  Compass, Hammer, Plug, ShieldCheck, BarChart3, Lightbulb, Sparkles
} from 'lucide-react';

const PHASES = [
  { num: '01', title: 'Specify', desc: 'Capture intent, KPIs, guardrails, and personas in agents.md — the single source of truth Copilot reads from.' },
  { num: '02', title: 'Scaffold', desc: 'Copilot generates the agent definition, skills, tools, prompts, evals, and Bicep IaC in your repo.' },
  { num: '03', title: 'Evaluate', desc: 'Offline eval harness runs in CI, scoring quality, safety, and cost against golden datasets on every PR.' },
  { num: '04', title: 'Deploy', desc: 'Promote to a Foundry project with vetted defaults: managed identity, private networking, content safety, quotas.' },
  { num: '05', title: 'Observe', desc: 'OpenTelemetry traces, content-safety verdicts, and judge scores stream into the Foundry portal in real time.' },
  { num: '06', title: 'Improve', desc: 'Continuous evals and the prompt optimizer turn production signals into Copilot pull requests — the loop closes.' },
];

export default function AgenticLoop() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Agentic Loop</div>
        <h1>Build with Copilot. Run with Foundry. Improve every iteration.</h1>
        <p className="lede">
          The Agentic Loop is the operating model for shipping production AI agents. It pairs <strong>GitHub Copilot</strong> — your AI pair-programmer for designing, scaffolding, and evaluating agents — with <strong>Microsoft Foundry</strong> — the enterprise-grade platform for hosting, orchestrating, governing, and continuously evaluating them. Together they form a closed feedback loop where every production signal becomes the next code change.
        </p>
      </div>

      <div className="loop-diagram">
        <div className="loop-side">
          <h3><Github size={16} style={{ verticalAlign: 'middle' }} /> Build · GitHub Copilot</h3>
          <p>Agents.md, spec-driven scaffolding, code generation, eval harness authoring, and PR-based iteration — all in your IDE.</p>
        </div>
        <div className="loop-arrow"><ArrowRight size={22} /></div>
        <div className="loop-side">
          <h3><Cloud size={16} style={{ verticalAlign: 'middle' }} /> Run · Microsoft Foundry</h3>
          <p>Hosted agents, model catalog, knowledge connectors, observability, content safety, governance, and continuous eval at enterprise scale.</p>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="ic"><Code2 size={18} /></div>
          <h3>Spec-driven development</h3>
          <p>Describe the agent in natural language; Copilot turns intent into agent definitions, tools, prompts, and Bicep.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><Rocket size={18} /></div>
          <h3>One-click deploy</h3>
          <p>Promote from your repo to a Foundry project with vetted defaults: identity, networking, and quotas.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><Eye size={18} /></div>
          <h3>Always-on evaluation</h3>
          <p>Run offline evals in CI and continuous evals on production traces — trends, regressions, and explanations.</p>
        </div>
        <div className="feature-card">
          <div className="ic"><RefreshCw size={18} /></div>
          <h3>Self-improving loop</h3>
          <p>Production traces feed prompt optimizers and curated datasets, opening Copilot PRs to ship the next iteration.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy</div>
        <h2>The six phases of the loop</h2>
        <p className="lede">Each turn around the loop tightens the gap between intent and behaviour in production.</p>
        <div className="phase-grid">
          {PHASES.map(p => (
            <div key={p.num} className="phase-card">
              <span className="phase-num">{p.num}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Reference</div>
        <h2>What Copilot writes, what Foundry runs</h2>
        <p className="lede">A clean separation of concerns keeps your repo portable and your runtime governed.</p>
        <table className="compare-table">
          <thead>
            <tr><th>Surface</th><th>GitHub Copilot (build time)</th><th>Microsoft Foundry (run time)</th></tr>
          </thead>
          <tbody>
            <tr><td>Agent definition</td><td>Generates <code>agent.yaml</code> from <code>agents.md</code>.</td><td>Validates, versions, and hosts the agent.</td></tr>
            <tr><td>Skills</td><td>Authors prompts, schemas, and unit evals as code.</td><td>Resolves dependencies and enforces policies at invocation.</td></tr>
            <tr><td>Tools</td><td>Generates OpenAPI / MCP bindings and tests.</td><td>Mediates calls with auth, retries, rate limits, and audit.</td></tr>
            <tr><td>Knowledge</td><td>Defines connectors and chunking strategy.</td><td>Builds and serves the hybrid vector + keyword index.</td></tr>
            <tr><td>Evaluation</td><td>Runs offline eval suites on every PR.</td><td>Runs continuous eval on sampled production traces.</td></tr>
            <tr><td>Improvement</td><td>Opens PRs with prompt and skill changes.</td><td>Surfaces failure clusters and regression candidates.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">In practice</div>
        <h2>A day in the loop</h2>
        <ul className="checklist">
          <li>
            <span className="check-ic"><Compass size={12} /></span>
            <div><b>09:00 · Triage</b><span>A continuous-eval alert flags a 4% regression in groundedness on the billing skill after a model upgrade.</span></div>
          </li>
          <li>
            <span className="check-ic"><Hammer size={12} /></span>
            <div><b>09:30 · Reproduce</b><span>Copilot fetches the failing traces, regenerates a regression eval, and proposes a prompt diff with the optimizer.</span></div>
          </li>
          <li>
            <span className="check-ic"><BarChart3 size={12} /></span>
            <div><b>10:15 · Validate</b><span>CI runs the new eval set; quality recovers and safety stays green. The reviewer approves.</span></div>
          </li>
          <li>
            <span className="check-ic"><Rocket size={12} /></span>
            <div><b>10:45 · Canary</b><span>Foundry splits 10% of traffic to the new version; live metrics confirm parity. Roll out continues.</span></div>
          </li>
          <li>
            <span className="check-ic"><RefreshCw size={12} /></span>
            <div><b>11:30 · Capture</b><span>The traces that proved the fix are added to the golden set — preventing the same class of regression forever.</span></div>
          </li>
        </ul>
      </section>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>The loop only works if both ends are sharp</h3>
          <p>Without rigorous evals, Copilot can't safely improve the agent. Without observability, Foundry can't tell you what to improve. Invest in both — and the loop runs itself.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Why a loop?</div>
        <h2>Traditional pipelines vs. the Agentic Loop</h2>
        <p className="lede">Classical ML shipped a model and called it done. Agentic systems are alive — they need a control surface that closes the gap between deployed behaviour and authored intent, fast.</p>
        <table className="compare-table">
          <thead><tr><th>Dimension</th><th>Traditional ML pipeline</th><th>Agentic Loop</th></tr></thead>
          <tbody>
            <tr><td>Unit of work</td><td>Trained model artefact</td><td>Composable agent + skills + tools + policies</td></tr>
            <tr><td>Iteration speed</td><td>Weeks per training cycle</td><td>Hours — a PR is the unit of change</td></tr>
            <tr><td>Quality signal</td><td>Offline metrics on a frozen test set</td><td>Continuous evals on live production traces</td></tr>
            <tr><td>Improvement loop</td><td>Manual retraining</td><td>Automated optimizer → Copilot PR → CI evals</td></tr>
            <tr><td>Governance</td><td>Bolted on at deployment</td><td>Declarative, enforced at every tool call</td></tr>
            <tr><td>Reuse</td><td>Forking a notebook</td><td>Versioned skills published to an internal catalog</td></tr>
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Architecture</div>
        <h2>The reference topology</h2>
        <p className="lede">A single repo, a single Foundry project, one signal-flow you can reason about end to end.</p>
        <div className="arch-diagram">
          <div className="arch-col">
            <div className="arch-eyebrow">Build · GitHub</div>
            <div className="arch-node"><Code2 size={16} /> agents.md</div>
            <div className="arch-node"><Code2 size={16} /> skills/</div>
            <div className="arch-node"><Code2 size={16} /> tools/</div>
            <div className="arch-node"><BarChart3 size={16} /> evals/</div>
            <div className="arch-node accent"><Github size={16} /> Copilot PRs</div>
          </div>
          <div className="arch-flow">
            <span className="arch-arrow"><ArrowRight size={18} /></span>
            <span className="arch-label">deploy</span>
            <span className="arch-arrow back"><ArrowRight size={18} /></span>
            <span className="arch-label">improve</span>
          </div>
          <div className="arch-col">
            <div className="arch-eyebrow">Run · Foundry</div>
            <div className="arch-node"><Cloud size={16} /> Hosted agent</div>
            <div className="arch-node"><Plug size={16} /> Tool gateway</div>
            <div className="arch-node"><ShieldCheck size={16} /> Policy engine</div>
            <div className="arch-node"><Eye size={16} /> Trace store + judges</div>
            <div className="arch-node accent"><RefreshCw size={16} /> Prompt optimizer</div>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Operating principles</div>
        <h2>Five rules to live by</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="ic"><Compass size={18} /></div>
            <h3>1 · Spec before code</h3>
            <p>Capture intent in agents.md. Copilot reads it; humans review it; the spec gates every PR.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><BarChart3 size={18} /></div>
            <h3>2 · Eval before prompt</h3>
            <p>Write golden cases first. A failing eval is the most honest prompt-engineering brief you'll ever get.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><ShieldCheck size={18} /></div>
            <h3>3 · Govern at the edge</h3>
            <p>Every tool call is policy-checked server-side. Don't put trust in prompts you can put in code.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><Eye size={18} /></div>
            <h3>4 · Observe everything</h3>
            <p>Traces, evals, costs, policy verdicts — all queryable, all versioned, all wired into the same dashboard.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><RefreshCw size={18} /></div>
            <h3>5 · Automate the loop</h3>
            <p>Production failures should open PRs by themselves. The team's job is to review — not to find them.</p>
          </div>
          <div className="feature-card">
            <div className="ic"><Sparkles size={18} /></div>
            <h3>6 · Small, sharp pieces</h3>
            <p>One skill, one verb. One tool, one capability. Composition gives you the breadth — discipline gives you the trust.</p>
          </div>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">FAQ</div>
        <h2>Frequently asked</h2>
        <div className="faq-grid">
          <details className="faq">
            <summary>Do I have to use both Copilot and Foundry?</summary>
            <p>No — but the loop only closes when you do. Copilot without Foundry means you ship agents you can't observe or improve in production. Foundry without Copilot means you author and iterate by hand. Together, the build-time and run-time signals become one continuous feedback loop.</p>
          </details>
          <details className="faq">
            <summary>Is this for chatbots, or something bigger?</summary>
            <p>Both. The same loop applies to a one-skill copilot inside an internal app and to a crew of agents running long-horizon workflows. Start narrow; let the catalog and the eval suites grow with you.</p>
          </details>
          <details className="faq">
            <summary>How does this compare to a vector DB + LLM stack?</summary>
            <p>RAG is a tactic; the Agentic Loop is an operating model. Retrieval is a tool an agent uses — Foundry hosts it, evals score it, Copilot improves it. The loop wraps the whole stack, RAG included.</p>
          </details>
          <details className="faq">
            <summary>What about cost?</summary>
            <p>Continuous eval samples — it doesn't replay every trace. The biggest savings come from the cheap-router-smart-worker pattern and from the optimizer cutting tokens on hot skills. Most teams break even inside the first month.</p>
          </details>
          <details className="faq">
            <summary>Can my data stay in my tenant?</summary>
            <p>Yes. Foundry deploys inside your Azure subscription, behind your VNet, with managed identity. Customer data, prompts, and traces never leave your perimeter.</p>
          </details>
          <details className="faq">
            <summary>How do I roll back a bad version?</summary>
            <p>Every agent and skill is versioned. Foundry supports canary deployments and instant rollback; the Copilot PR that introduced the regression is linked from the trace.</p>
          </details>
        </div>
      </section>
    </>
  );
}
