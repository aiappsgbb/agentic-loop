import {
  ArrowRight, Bot, Brain, CheckCircle2, Code as Github, Code2, Database,
  Eye, MessageSquare, PackageCheck, RefreshCw, Send, Sparkles, Terminal,
  Wrench,
} from 'lucide-react';

const LOOP_STEPS = [
  {
    num: '1',
    tone: 'reason',
    icon: Brain,
    title: 'Reason',
    subtitle: 'Gather context',
    items: ['Analyze prompt + history', 'Load relevant context', 'Pick SKILLs and tools', 'Form a plan'],
  },
  {
    num: '2',
    tone: 'act',
    icon: Wrench,
    title: 'Act',
    subtitle: 'Execute tool calls',
    items: ['Invoke MCP tools', 'Call APIs or search', 'Generate or edit code', 'Stream partial results'],
  },
  {
    num: '3',
    tone: 'observe',
    icon: Eye,
    title: 'Observe',
    subtitle: 'Decide what is next',
    items: ['Parse tool output', 'Compact context', 'Enough? Respond', 'Need more? Loop back'],
  },
];

const SUPPORT_CARDS = [
  {
    icon: Database,
    title: 'Context is active',
    text: 'The agent keeps asking whether it has enough context to act safely. If not, it retrieves more and loops.',
  },
  {
    icon: PackageCheck,
    title: 'SKILLs add capability',
    text: 'SKILLs package reusable instructions, tools, schemas, and guardrails the agent can pull into a turn.',
  },
  {
    icon: RefreshCw,
    title: 'Iteration is automatic',
    text: 'The user gives intent. The agent handles reasoning, tool execution, observation, and retry.',
  },
];

const EXAMPLES = [
  {
    icon: Github,
    title: 'GitHub Copilot',
    text: 'Reads code, chooses tools, edits files, runs checks, then loops on failures before summarizing the change.',
  },
  {
    icon: Terminal,
    title: 'Claude Code',
    text: 'Works in a repo, gathers context, calls shell and file tools, observes output, and keeps going until the task is coherent.',
  },
  {
    icon: Code2,
    title: 'Cursor Agent',
    text: 'Turns an instruction into search, edits, terminal runs, and follow-up fixes across multiple project files.',
  },
  {
    icon: Bot,
    title: 'Autonomous coding agents',
    text: 'Tools such as Devin-style agents plan work, execute steps, inspect results, and continue until they can hand back a result.',
  },
];

export default function AgenticLoop() {
  return (
    <>
      <div className="page-head agentic-loop-hero">
        <div className="page-eyebrow">Concept · Agentic Loop</div>
        <h1>Reason. Act. Observe. Repeat until ready.</h1>
        <p className="lede">
          The Agentic Loop is the runtime pattern behind autonomous agents: understand the request, gather just enough context, use SKILLs and tools, inspect the result, then either answer or loop again.
        </p>
        <div className="agentic-loop-pills" aria-label="Agentic Loop highlights">
          <span><Sparkles size={14} /> Powered by GitHub Copilot SDK</span>
          <span><RefreshCw size={14} /> No manual orchestration</span>
          <span><CheckCircle2 size={14} /> Stops when there is enough signal</span>
        </div>
      </div>

      <section className="agentic-loop-board" aria-label="Agentic Loop diagram">
        <div className="loop-end loop-input">
          <div className="loop-end-icon"><MessageSquare size={22} /></div>
          <h2>User prompt</h2>
          <p>Natural-language task or question.</p>
        </div>

        <ArrowRight className="loop-connector" size={28} aria-hidden="true" />

        <div className="loop-stage-wrap">
          {LOOP_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="loop-stage-group" key={step.title}>
                <article className={`loop-stage loop-stage-${step.tone}`}>
                  <div className="loop-stage-head">
                    <span className="loop-stage-num">{step.num}</span>
                    <div>
                      <h2><Icon size={22} /> {step.title}</h2>
                      <p>{step.subtitle}</p>
                    </div>
                  </div>
                  <ul>
                    {step.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </article>
                {index < LOOP_STEPS.length - 1 && (
                  <ArrowRight className="loop-stage-arrow" size={28} aria-hidden="true" />
                )}
              </div>
            );
          })}
          <div className="loop-back" aria-hidden="true">
            <span>Loop back if more information is needed</span>
          </div>
        </div>

        <ArrowRight className="loop-connector" size={28} aria-hidden="true" />

        <div className="loop-end loop-output">
          <div className="loop-end-icon"><Send size={22} /></div>
          <h2>Streamed response</h2>
          <p>Final answer returned to the user.</p>
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">The idea</div>
        <h2>An agent keeps moving until the answer is earned.</h2>
        <p className="lede">
          Every pass through the loop adds signal: more context, a tool result, a refined plan, or enough confidence to respond.
        </p>
        <div className="feature-grid">
          {SUPPORT_CARDS.map(card => {
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
        <div className="section-eyebrow">Examples</div>
        <h2>Where you already see this loop.</h2>
        <p className="lede">
          The pattern shows up anywhere an assistant can inspect state, use tools, and decide whether it needs another pass.
        </p>
        <div className="feature-grid agentic-loop-examples">
          {EXAMPLES.map(example => {
            const Icon = example.icon;
            return (
              <div className="feature-card" key={example.title}>
                <div className="ic"><Icon size={18} /></div>
                <h3>{example.title}</h3>
                <p>{example.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="callout agentic-loop-callout">
        <div className="ic"><Brain size={20} /></div>
        <div>
          <h3>The loop is simple; the judgment is the hard part.</h3>
          <p>
            Great agents know when to fetch more context, when to invoke a SKILL, and when the observed result is good enough to stop.
          </p>
        </div>
      </div>
    </>
  );
}
