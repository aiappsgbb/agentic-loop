import { Link } from 'react-router-dom';
import {
  Bot, Brain, CheckCircle2, Code2, Database, GitBranch, Layers,
  Lightbulb, MemoryStick, MessagesSquare, Network, Quote, RefreshCw,
  Search, ShieldCheck, Workflow, Wrench,
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon: <Brain size={18} />,
    title: 'Reasons over a goal',
    text: 'The model interprets intent, decomposes work, and decides the next step toward a goal.',
  },
  {
    icon: <Wrench size={18} />,
    title: 'Uses tools',
    text: 'Tools let the agent retrieve facts, call APIs, run code, and update external systems.',
  },
  {
    icon: <Layers size={18} />,
    title: 'Composes skills',
    text: 'Skills sit beside tools as reusable bundles of instructions, schemas, tool bindings, evals, and guardrails.',
  },
  {
    icon: <RefreshCw size={18} />,
    title: 'Loops on feedback',
    text: 'Each tool result or observation becomes new context: continue, retry, ask, or stop.',
  },
  {
    icon: <Database size={18} />,
    title: 'Keeps state',
    text: 'Threads, memory, checkpoints, and structured outputs let work span turns or background events.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Runs under guardrails',
    text: 'Identity, approvals, schemas, content safety, evals, and tracing constrain autonomy.',
  },
  {
    icon: <GitBranch size={18} />,
    title: 'Can collaborate',
    text: 'Complex systems split work across planners, specialists, critics, and human reviewers.',
  },
];

const VISUAL_INPUTS = [
  { icon: <MessagesSquare size={22} />, label: 'User messages' },
  { icon: <Lightbulb size={22} />, label: 'System events' },
  { icon: <Bot size={22} />, label: 'Agent messages' },
];

const VISUAL_TOOLS = [
  { icon: <Search size={22} />, label: 'Retrieval' },
  { icon: <Wrench size={22} />, label: 'Actions' },
  { icon: <MemoryStick size={22} />, label: 'Memory' },
];

const VISUAL_OUTPUTS = [
  { icon: <Bot size={22} />, label: 'Agent messages' },
  { icon: <Code2 size={22} />, label: 'Structured output' },
];

const SOURCE_DEFINITIONS: [string, string][] = [
  ['Microsoft Foundry', 'An AI application that uses a model to reason about requests and take autonomous actions, even running in the background without a chat interface. Core components: model, instructions, tools.'],
  ['OpenAI', 'A system with instructions, guardrails, and tools that can take action on the user\u2019s behalf. If it only answers, it is a chatbot; if it connects to systems and acts, it is an agent.'],
  ['Anthropic', 'A system where the LLM dynamically directs its own process and tool use, typically using environmental feedback in a loop \u2014 distinct from fixed-path workflows.'],
];

const ANATOMY: [string, 'Mandatory' | 'Optional', string][] = [
  ['Model', 'Mandatory', 'Reasoning and language capability from a frontier or fit-for-purpose model.'],
  ['Instructions', 'Mandatory', 'Role, scope, constraints, tone, tool policy, and stopping rules.'],
  ['Skills', 'Optional', 'Reusable capability bundles that package instructions, tool bindings, schemas, evals, and guardrails.'],
  ['Tools', 'Optional', 'Typed ways to retrieve data or act: APIs, MCP servers, search, code, workflows.'],
  ['State', 'Optional', 'Threads, task memory, checkpoints, and resumable run context.'],
  ['Grounding', 'Optional', 'External knowledge that ties answers to current, authorized sources.'],
  ['Guardrails', 'Optional', 'Schema validation, approvals, content safety, identity, tracing, and evals.'],
];

const BOUNDARIES: [string, string, string][] = [
  ['Single LLM call', 'No', 'It can answer, but it does not continue, inspect results, or act.'],
  ['RAG chatbot', 'Usually no', 'Retrieval improves answers, but the flow is still mostly fixed.'],
  ['Workflow', 'Sometimes', 'Agentic when the model makes decisions; less so when code owns every step.'],
  ['Agent', 'Yes', 'The model decides steps and tool use, observes outcomes, and continues until done or blocked.'],
  ['Multi-agent system', 'Yes', 'Multiple agents coordinate through handoffs, shared state, or specialized roles.'],
];

const TOPOLOGIES: [string, string, string][] = [
  ['Single agent', 'Focused tasks with one clear owner.', 'Simple to reason about; bounded by one context and tool set.'],
  ['Planner / executor', 'Long-horizon work that benefits from decomposition.', 'More latency and cost; better control over complex execution.'],
  ['Specialist crew', 'Tasks spanning research, design, code, and review.', 'Requires explicit handoffs and shared state.'],
  ['Evaluator loop', 'High-stakes outputs that need critique and refinement.', 'Adds cost; improves quality when eval criteria are clear.'],
  ['Human-in-the-loop', 'Regulated, expensive, or irreversible actions.', 'Slower, but preserves accountability and approval.'],
];

const HOSTED_RUNTIME: [string, string][] = [
  ['Agent code', 'Owns orchestration, tool choices, protocol handling, framework logic, and domain behavior.'],
  ['Foundry runtime', 'Hosts the container, exposes endpoints, scales compute, restores state, and emits traces.'],
  ['Agent identity', 'Gives the running agent a dedicated Microsoft Entra identity for scoped access and audit.'],
  ['Session boundary', 'Runs each session in an isolated sandbox so state persists without leaking across users.'],
];

const DESIGN_RULES = [
  {
    icon: <Workflow size={18} />,
    title: 'Start simple',
    text: 'Use a direct model call or workflow when the path is fixed. Add autonomy only when steps cannot be predicted.',
  },
  {
    icon: <Layers size={18} />,
    title: 'Make tools boring',
    text: 'Narrow, typed, idempotent, well-described, and explicit about errors beats clever prompting.',
  },
  {
    icon: <CheckCircle2 size={18} />,
    title: 'Define stopping rules',
    text: 'Success criteria, budget limits, iteration caps, and escalation paths for every run.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Keep guardrails close to action',
    text: 'Approvals, scopes, rate limits, schemas, and audit logs live next to the tools that act.',
  },
  {
    icon: <MessagesSquare size={18} />,
    title: 'Design for handoff',
    text: 'Agents should know when to ask the user, transfer to another agent, or pause for human judgment.',
  },
  {
    icon: <Network size={18} />,
    title: 'Govern like a service',
    text: 'Version, test, trace, and evaluate agents continuously \u2014 not just prompt and ship.',
  },
];

export default function Agents() {
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Concept · Agents</div>
        <h1>Agents reason over a goal, use tools, and act under guardrails.</h1>
        <p className="lede">
          An AI agent combines a model, instructions, skills, tools, state, and guardrails to complete work on a user&apos;s or organization&apos;s behalf. The difference from a chatbot is agency: an agent can decide what to do next, call tools, observe results, and continue until it can answer, hand off, or stop safely.
        </p>
      </div>

      <section className="agent-model-board" aria-label="Agent component diagram">
        <div className="agent-model-card agent-model-side">
          <h2>Input</h2>
          <div className="agent-model-icons">
            {VISUAL_INPUTS.map(item => (
              <div className="agent-model-item" key={item.label}>
                <div className="agent-model-ic">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="agent-model-arrow" aria-hidden="true">→</div>

        <div className="agent-model-stack">
          <div className="agent-model-card agent-model-core">
            <div className="agent-model-spark"><Bot size={24} /></div>
            <h2>Agent</h2>
            <div className="agent-model-layer">LLM</div>
            <div className="agent-model-layer">Instructions</div>
            <div className="agent-model-layer-row">
              <Link to="/concepts/skills" className="agent-model-layer agent-model-layer-link agent-model-layer-skill">Skills</Link>
              <Link to="/concepts/tools" className="agent-model-layer agent-model-layer-link">Tools</Link>
            </div>
          </div>
          <div className="agent-model-card agent-model-tools">
            <h2>Tool calls</h2>
            <div className="agent-model-icons">
              {VISUAL_TOOLS.map(item => (
                <div className="agent-model-item" key={item.label}>
                  <div className="agent-model-ic">{item.icon}</div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="agent-model-arrow" aria-hidden="true">→</div>

        <div className="agent-model-card agent-model-side">
          <h2>Output</h2>
          <div className="agent-model-icons">
            {VISUAL_OUTPUTS.map(item => (
              <div className="agent-model-item" key={item.label}>
                <div className="agent-model-ic">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Quote size={20} /></div>
        <div>
          <h3>The concise definition</h3>
          <p>An AI agent is a skill- and tool-using AI application that follows instructions, reasons over a goal, keeps enough context, and takes governed actions across one or more steps to produce a response, structured output, handoff, or completed task.</p>
        </div>
      </div>

      <div className="feature-grid">
        {CAPABILITIES.map(item => (
          <div className="feature-card" key={item.title}>
            <div className="ic">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Definition</div>
        <h2>A consistent, sourced view</h2>
        <p className="lede">
          Across Microsoft, OpenAI, and Anthropic, the framing converges: agents are skill- and tool-using AI applications that decide and execute multi-step work, not just text generators.
        </p>
        <table className="compare-table">
          <thead><tr><th>Source</th><th>How it frames agents</th></tr></thead>
          <tbody>
            {SOURCE_DEFINITIONS.map(([source, definition]) => (
              <tr key={source}><td>{source}</td><td>{definition}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Anatomy</div>
        <h2>What belongs inside an agent</h2>
        <div className="phase-grid">
          {ANATOMY.map(([name, requirement, text]) => (
            <div className="phase-card" key={name}>
              <span className={`phase-num ${requirement === 'Mandatory' ? 'is-required' : 'is-optional'}`}>{requirement}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Boundaries</div>
        <h2>What is, and is not, an agent</h2>
        <table className="compare-table">
          <thead><tr><th>System</th><th>Agent?</th><th>Why</th></tr></thead>
          <tbody>
            {BOUNDARIES.map(([system, answer, why]) => (
              <tr key={system}><td>{system}</td><td>{answer}</td><td>{why}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Topologies</div>
        <h2>From one agent to governed crews</h2>
        <table className="compare-table">
          <thead><tr><th>Pattern</th><th>When to use it</th><th>Trade-off</th></tr></thead>
          <tbody>
            {TOPOLOGIES.map(([pattern, use, tradeoff]) => (
              <tr key={pattern}><td>{pattern}</td><td>{use}</td><td>{tradeoff}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Foundry hosted agents</div>
        <h2>A hosted agent is an agent runtime, not a new intelligence layer.</h2>
        <p className="lede">
          Hosted agents separate agent behavior from agent operations. Your code owns orchestration and domain logic; Foundry provides the managed runtime — endpoint, identity, scaling, session isolation, state persistence, observability, and lifecycle management. Reach for it when an agent is more than prompt configuration: custom code, custom protocols, stateful execution, or enterprise integration.
        </p>
        <div className="phase-grid">
          {HOSTED_RUNTIME.map(([name, text]) => (
            <div className="phase-card" key={name}>
              <span className="phase-num">{name}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Example</div>
        <h2>A minimal agent contract</h2>
        <p className="lede">
          For a Foundry Hosted Agent, <code>agent.yaml</code> defines the container-backed agent resource: kind, protocols, runtime resources, environment variables, and code packaging. Model deployments and connections live in <code>azure.yaml</code> and the active azd environment.
        </p>
        <div className="code-sample">
          <div className="code-sample-head"><Code2 size={13} /> agent.yaml</div>
          <pre>{`# yaml-language-server: $schema=https://raw.githubusercontent.com/microsoft/AgentSchema/refs/heads/main/schemas/v1.0/ContainerAgent.yaml
kind: hosted
name: billing-resolution-agent
protocols:
  - protocol: responses
    version: "1.0.0"
resources:
  cpu: "0.25"
  memory: "0.5Gi"
environment_variables:
  - name: AZURE_AI_MODEL_DEPLOYMENT_NAME
    value: \${AZURE_AI_MODEL_DEPLOYMENT_NAME}
code_configuration:
  runtime: python_3_13
  entry_point: main.py
  dependency_resolution: remote_build`}</pre>
        </div>
        <p className="lede agent-source-note">
          Source: <a href="https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/hosted-agents" target="_blank" rel="noreferrer">Foundry hosted agents</a> and the <a href="https://raw.githubusercontent.com/microsoft/AgentSchema/refs/heads/main/schemas/v1.0/ContainerAgent.yaml" target="_blank" rel="noreferrer">ContainerAgent schema</a>.
        </p>
      </section>

      <div className="callout">
        <div className="ic"><Lightbulb size={20} /></div>
        <div>
          <h3>Treat the agent like a governed service, not a clever prompt.</h3>
          <p>Version the instructions, narrow the tools, test the loop, observe every decision, and reserve autonomy for tasks where model-directed steps are actually needed.</p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Production design rules</div>
        <h2>How to keep agents reliable</h2>
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
        <div className="ic"><Bot size={20} /></div>
        <div>
          <h3>How Foundry frames a production-ready agent.</h3>
          <p>A model-backed reasoning service, a declarative or code-based runtime with instructions, skills, tools, state, and policies, a governed actor with identity, schemas, tracing, and evals, and a composable unit that can run alone, call tools, or collaborate with other agents.</p>
        </div>
      </div>
    </>
  );
}
