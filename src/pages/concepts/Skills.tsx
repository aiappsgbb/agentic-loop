import {
  Sparkles, Layers, GitMerge, TestTube2, Recycle, FileCode2,
  Code2, Lightbulb, Package, Workflow
} from 'lucide-react';

export default function Skills() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Skills</div>
        <h1>Skills package capability into reusable, evaluable units.</h1>
        <p className="lede">
          A skill is a versioned bundle of prompts, tools, evals, and policies that an agent can compose. Skills can be authored with GitHub Copilot, shared across teams, and hosted in Foundry — giving you a portfolio of capabilities you can mix and match like Lego pieces.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card"><div className="ic"><FileCode2 size={18} /></div><h3>Authored as code</h3><p>Skills live in your repo as plain files — prompts, schemas, test cases — reviewable in PRs.</p></div>
        <div className="feature-card"><div className="ic"><Layers size={18} /></div><h3>Composable by design</h3><p>Agents declare the skills they need; Foundry resolves versions, dependencies, and permissions.</p></div>
        <div className="feature-card"><div className="ic"><TestTube2 size={18} /></div><h3>Evaluated independently</h3><p>Each skill ships with its own eval set so regressions surface before they reach production.</p></div>
        <div className="feature-card"><div className="ic"><GitMerge size={18} /></div><h3>Versioned & shareable</h3><p>Publish skills to internal registries — teams reuse what works without forking implementation details.</p></div>
        <div className="feature-card"><div className="ic"><Recycle size={18} /></div><h3>Continuously improved</h3><p>Production traces inform prompt optimizers that propose new skill versions via Copilot PRs.</p></div>
        <div className="feature-card"><div className="ic"><Sparkles size={18} /></div><h3>Discoverable by Copilot</h3><p>When you describe a feature, Copilot suggests the right skills from your catalog — and scaffolds the rest.</p></div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Inside a skill</div>
        <h2>Six files, one capability</h2>
        <table className="compare-table">
          <thead><tr><th>File</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>SKILL.md</code></td><td>Human-readable description, inputs, outputs, and when to use it. The contract.</td></tr>
            <tr><td><code>prompt.md</code></td><td>System and user prompt templates with typed parameters.</td></tr>
            <tr><td><code>schema.json</code></td><td>Strict JSON schema for inputs and outputs — gates tool invocation.</td></tr>
            <tr><td><code>tools.yaml</code></td><td>Tools the skill depends on, with permission scopes.</td></tr>
            <tr><td><code>evals/*.jsonl</code></td><td>Golden cases, regression cases, and red-team cases.</td></tr>
            <tr><td><code>policy.yaml</code></td><td>Content safety, redaction, and rate-limit overrides specific to this skill.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Example</div>
        <h2>A skill manifest</h2>
        <div className="code-sample">
          <div className="code-sample-head"><Code2 size={13} /> skills/answer-billing-question/SKILL.md</div>
          <pre>{`---
name: answer-billing-question
version: 1.4.0
description: Answer customer billing questions grounded in the latest policy docs.
inputs:
  question: string  # the customer's natural-language question
  customer_id: string
outputs:
  answer: string
  citations: Citation[]
tools:
  - knowledge-search:billing-docs
  - billing-api:get-account
policies:
  content_safety: strict
  redact: [account_number]
evals:
  - golden: 84 cases
  - regression: 31 cases
  - red_team: 12 cases
---`}</pre>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Lifecycle</div>
        <h2>How a skill grows up</h2>
        <div className="phase-grid">
          <div className="phase-card"><span className="phase-num">01</span><h3>Draft</h3><p>Copilot generates the skill from a one-line description and a sample input/output pair.</p></div>
          <div className="phase-card"><span className="phase-num">02</span><h3>Evaluate</h3><p>You add 10–20 golden cases; CI scores them and gates the PR on a quality bar.</p></div>
          <div className="phase-card"><span className="phase-num">03</span><h3>Publish</h3><p>Tag a version; the skill is registered in your internal catalog and discoverable by other agents.</p></div>
          <div className="phase-card"><span className="phase-num">04</span><h3>Observe</h3><p>Foundry tags every trace with the skill version, surfacing live quality and cost in dashboards.</p></div>
          <div className="phase-card"><span className="phase-num">05</span><h3>Optimize</h3><p>The prompt optimizer mines failure clusters and proposes a new minor version as a Copilot PR.</p></div>
          <div className="phase-card"><span className="phase-num">06</span><h3>Deprecate</h3><p>Old versions stay reachable for reproducibility; Foundry warns consumers before sunset.</p></div>
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>Skills are the unit of reuse — not agents</h3>
          <p>Agents change with use cases; skills outlive them. Invest in a small, sharp catalog of skills and most new agents become a few lines of YAML.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Good habits</div>
        <h2>What separates great skills from mediocre ones</h2>
        <div className="feature-grid">
          <div className="feature-card"><div className="ic"><Package size={18} /></div><h3>Narrow scope</h3><p>One capability per skill. Composition gives you breadth — narrowness gives you reliability.</p></div>
          <div className="feature-card"><div className="ic"><TestTube2 size={18} /></div><h3>Evals before prose</h3><p>Write the eval cases first; the prompt becomes a tool for passing them.</p></div>
          <div className="feature-card"><div className="ic"><Workflow size={18} /></div><h3>Schema-locked I/O</h3><p>Strict schemas turn the skill into a typed function the rest of the system can trust.</p></div>
        </div>
      </section>
    </>
  );
}
