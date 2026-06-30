import { Link } from 'react-router-dom';
import {
  Boxes, ShieldCheck, RefreshCw,
  Activity, Cpu, FileCode, GitBranch,
  Layers, BookText,
} from 'lucide-react';

const DEFINITIONS = [
  {
    icon: BookText,
    source: 'Microsoft Learn',
    label: 'Agent harnesses',
    href: 'https://learn.microsoft.com/en-us/agent-framework/agents/harness',
    quote: 'An agent harness is the scaffolding that turns a language model into an agent that can actually do things.',
    detail: 'Directly defines the term and describes the loop, tool execution, context, approval, and safety responsibilities.',
  },
  {
    icon: Layers,
    source: 'Anthropic',
    label: 'Claude Managed Agents',
    href: 'https://platform.claude.com/docs/en/managed-agents/overview',
    quote: 'A pre-built, configurable agent harness that runs in managed infrastructure.',
    detail: 'Uses the term for managed infrastructure that runs Claude as an autonomous tool-using agent.',
  },
  {
    icon: Cpu,
    source: 'OpenAI',
    label: 'Sandbox agents',
    href: 'https://developers.openai.com/api/docs/guides/agents/sandboxes',
    quote: 'The harness is the control plane around the model: it owns the agent loop, model calls, tool routing, handoffs, approvals, tracing, recovery, and run state.',
    detail: 'Defines the harness as the control plane and separates it from sandbox compute.',
  },
];

const LOOP_CONCEPTS = [
  { concept: 'Agent', what: 'The goal-directed AI actor.', example: 'A coding agent that decides which files to inspect and edit.' },
  { concept: 'Agentic loop', what: 'The repeated reason → act → observe cycle.', example: 'Read files, edit code, run tests, inspect failures, iterate.' },
  { concept: 'Tool', what: 'A callable capability.', example: 'Shell, file edit, GitHub API, MCP server, web fetch, code execution.' },
  { concept: 'Skill', what: 'A reusable recipe or capability package.', example: '“How to run a safe code migration.”' },
  { concept: 'Agent Harness', what: 'The runtime and policy envelope around the loop.', example: 'Session state, tool permissions, sandbox, tracing, approvals, PR workflow.' },
];

const COPILOT_SURFACES = [
  {
    icon: FileCode,
    title: 'Copilot CLI / local agent tools',
    text: 'The local harness gives the agent workspace context, shell and file tools, permission gates, session state, and user-facing progress.',
  },
  {
    icon: GitBranch,
    title: 'Copilot SDK via Microsoft Agent Framework',
    text: 'Agent Framework wraps GitHub Copilot as a backend agent with sessions, function tools, permission handlers, MCP servers, tracing, and application-owned orchestration.',
  },
  {
    icon: RefreshCw,
    title: 'Copilot cloud agent',
    text: 'GitHub supplies the harness: an ephemeral Actions environment, repo research, planning, branch changes, test execution, logs, and PR creation.',
  },
];

const ANATOMY = [
  { num: '01', title: 'Model adapter', text: 'Calls Azure OpenAI, OpenAI, Anthropic, GitHub Copilot, or another model backend.' },
  { num: '02', title: 'Instruction layer', text: 'Loads system instructions, developer rules, skills, examples, and task constraints.' },
  { num: '03', title: 'Context providers', text: 'Add repository files, search results, memory, user profile, telemetry, or prior session state.' },
  { num: '04', title: 'Tool registry', text: 'Defines available tools, schemas, descriptions, auth requirements, and trigger boundaries.' },
  { num: '05', title: 'Tool executor', text: 'Runs client tools, MCP calls, shell commands, file edits, API calls, or hosted tools.' },
  { num: '06', title: 'Permission policy', text: 'Blocks, approves, scopes, or escalates risky actions before execution.' },
  { num: '07', title: 'State manager', text: 'Persists conversation history, plans, checkpoints, observations, and resumable work.' },
  { num: '08', title: 'Observation parser', text: 'Normalizes tool results, errors, diffs, logs, and traces back into context.' },
  { num: '09', title: 'Stop rules', text: 'Enforces iteration limits, token and cost budgets, success criteria, timeouts, and handoffs.' },
  { num: '10', title: 'Observability', text: 'Emits traces, metrics, evals, run logs, audit events, and quality signals.' },
  { num: '11', title: 'Human interface', text: 'Streams progress, asks clarifying questions, stages PRs, requests approvals, and reports blockers.' },
];

export default function AgentHarness() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Agent Harness</div>
        <h1>The control plane around an agent.</h1>
        <p className="lede">
          An <strong>Agent Harness</strong> is the runtime layer that gives an agent context and tools, executes actions safely, observes results, preserves state, and decides when work is done, blocked, or ready for human review.
        </p>
        <div className="agentic-loop-pills" aria-label="Agent Harness highlights">
          <span><Boxes size={14} /> Tool and runtime control</span>
          <span><ShieldCheck size={14} /> Permissions, approvals, sandbox</span>
          <span><Activity size={14} /> State, tracing, stop rules</span>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Public sources</div>
        <h2>The term is public, but still emerging.</h2>
        <p className="lede">
          Microsoft, Anthropic, and OpenAI use the term or the same control-plane framing in public docs. These are the strongest citations for the concept.
        </p>
        <div className="feature-grid">
          {DEFINITIONS.map(def => {
            const Icon = def.icon;
            return (
              <div className="feature-card" key={def.source}>
                <div className="ic"><Icon size={18} /></div>
                <h3>{def.source}</h3>
                <p style={{ fontStyle: 'italic', marginBottom: 8 }}>“{def.quote}”</p>
                <p>{def.detail}</p>
                <p style={{ marginTop: 10 }}>
                  <a href={def.href} target="_blank" rel="noreferrer">{def.label} ↗</a>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Relation to the Agentic Loop</div>
        <h2>The loop is the behavior; the harness makes it executable.</h2>
        <p className="lede">
          The <Link to="/concepts/agentic-loop">Agentic Loop</Link> is the reason → act → observe pattern. The harness is the machinery that runs that loop: it feeds the model context and tools, executes actions, returns observations, and enforces budgets and stop rules.
        </p>
        <table className="compare-table">
          <thead><tr><th>Concept</th><th>What it is</th><th>Example</th></tr></thead>
          <tbody>
            {LOOP_CONCEPTS.map(row => (
              <tr key={row.concept}>
                <td><strong>{row.concept}</strong></td>
                <td>{row.what}</td>
                <td>{row.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Where GitHub Copilot fits</div>
        <h2>GitHub Copilot can be a harness, or run inside one.</h2>
        <p className="lede">
          GitHub Copilot is an agent and tool surface that either <strong>comes with its own harness</strong> or can be <strong>embedded inside another harness</strong> such as Microsoft Agent Framework. Coding work is a natural fit because it needs tools, state, iteration, and review.
        </p>
        <div className="feature-grid">
          {COPILOT_SURFACES.map(card => {
            const Icon = card.icon;
            return (
              <div className="feature-card" key={card.title}>
                <div className="ic"><Icon size={18} /></div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy of a harness</div>
        <h2>Eleven components that keep the loop controlled.</h2>
        <p className="lede">
          Each component owns one runtime concern. Together they turn a raw model call into a governed, observable, resumable agent.
        </p>
        <div className="phase-grid">
          {ANATOMY.map(item => (
            <div className="phase-card" key={item.num}>
              <span className="phase-num">{item.num}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="lede" style={{ marginTop: 24, opacity: 0.75, fontSize: 13.5 }}>
        Sources: <a href="https://learn.microsoft.com/en-us/agent-framework/agents/harness" target="_blank" rel="noreferrer">Microsoft Learn — Agent harnesses</a>,{' '}
        <a href="https://platform.claude.com/docs/en/managed-agents/overview" target="_blank" rel="noreferrer">Anthropic — Claude Managed Agents</a>,{' '}
        <a href="https://developers.openai.com/api/docs/guides/agents/sandboxes" target="_blank" rel="noreferrer">OpenAI — Sandbox agents</a>,{' '}
        <a href="https://learn.microsoft.com/en-us/agent-framework/agents/providers/github-copilot" target="_blank" rel="noreferrer">Microsoft Agent Framework — GitHub Copilot Agents</a>, and{' '}
        <a href="https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent" target="_blank" rel="noreferrer">GitHub Docs — Copilot cloud agent</a>.
      </p>
    </>
  );
}
