import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Boxes, RefreshCw, Cloud, Code2 as Github, Database, Eye, ArrowRight,
  ExternalLink, Plug, Layers, BookOpen, Sparkles, Wand2,
} from 'lucide-react';
import KratosLauncher from '../components/KratosLauncher';
import PersonaBuilder from '../components/PersonaBuilder';

type TryMode = 'curated' | 'custom';

const KRATOS_REPO = 'https://github.com/kmavrodis/kratos-agent';

const PILLARS = [
  { icon: Bot, title: 'One agent, N skills', desc: 'A single agent backed by swappable MCP skills — simpler to reason about, debug, and extend than multi-agent handoffs.' },
  { icon: RefreshCw, title: 'Reason → Act → Observe', desc: 'Every turn runs the Copilot SDK agentic loop: plan an approach, invoke tools, inspect results, and iterate to a complete answer.' },
  { icon: Cloud, title: 'Dual-compute architecture', desc: 'A Foundry-hosted agent runs the SDK loop; an Azure Container Apps proxy handles the frontend API, persistence, and admin.' },
  { icon: Plug, title: 'MCP skills, no redeploy', desc: 'Configure, toggle, and install remote skill packages and MCP servers per persona from a curated registry — live.' },
  { icon: Database, title: 'Stateful conversations', desc: 'Azure Cosmos DB persists conversations, messages, and session mappings; gateway session pinning keeps multi-turn state intact.' },
  { icon: Eye, title: 'Traced end to end', desc: 'OpenTelemetry with GenAI semantic conventions streams traces into Foundry for full request-flow observability.' },
];

export default function Kratos() {
  const [mode, setMode] = useState<TryMode>('curated');
  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Reference app · Kratos</div>
        <span className="kratos-badge"><Sparkles size={13} /> Live · embedded agent</span>
        <h1>Kratos — the Agentic Loop, in one reference app.</h1>
        <p className="lede">
          <strong>Kratos</strong> is a production-shaped reference implementation of the Agentic Loop: a single
          agent with persona switching, backed by swappable <strong>MCP skills</strong>, powered by the
          <strong> GitHub Copilot SDK</strong> and hosted on <strong>Microsoft Foundry</strong>. Describe an agent
          in plain language to generate a persona, or pick a prebuilt one — either opens the live embedded app.
        </p>
        <div className="kratos-cta-row">
          <a className="kratos-cta primary" href={KRATOS_REPO} target="_blank" rel="noreferrer">
            <Github size={16} /> View the repo <ExternalLink size={13} />
          </a>
          <Link className="kratos-cta" to="/concepts/agentic-loop">
            Learn the loop <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <section className="kratos-try-section">
        <div className="section-eyebrow">Try it live</div>
        <h2>Pick a curated persona — or describe your own</h2>
        <p className="lede">
          Start from a ready-made agent — recommended, no setup — or describe a custom one in plain
          language. Either one opens live in the embedded Kratos app under <code>/kratos</code>.
        </p>

        <div className="kratos-mode-toggle" role="tablist" aria-label="How would you like to start?">
          <button
            type="button"
            role="tab"
            id="kratos-tab-curated"
            aria-selected={mode === 'curated'}
            aria-controls="kratos-panel-curated"
            className={`kratos-mode-pill${mode === 'curated' ? ' active' : ''}`}
            onClick={() => setMode('curated')}
          >
            <Boxes size={15} />
            <span className="kratos-mode-pill-label">Curated personas</span>
            <span className="kratos-mode-pill-tag">Recommended</span>
          </button>
          <button
            type="button"
            role="tab"
            id="kratos-tab-custom"
            aria-selected={mode === 'custom'}
            aria-controls="kratos-panel-custom"
            className={`kratos-mode-pill${mode === 'custom' ? ' active' : ''}`}
            onClick={() => setMode('custom')}
          >
            <Wand2 size={15} />
            <span className="kratos-mode-pill-label">Describe your own</span>
          </button>
        </div>

        {mode === 'curated' ? (
          <div
            id="kratos-panel-curated"
            role="tabpanel"
            aria-labelledby="kratos-tab-curated"
            className="kratos-mode-panel"
          >
            <p className="kratos-mode-panel-lede">
              Pick a ready-made agent below — each opens live in the embedded Kratos app, no setup
              and no extra steps.
            </p>
            <KratosLauncher />
          </div>
        ) : (
          <div
            id="kratos-panel-custom"
            role="tabpanel"
            aria-labelledby="kratos-tab-custom"
            className="kratos-mode-panel kratos-mode-panel-builder"
          >
            <PersonaBuilder />
          </div>
        )}
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">What it shows</div>
        <h2>Why this architecture</h2>
        <p className="lede">
          Instead of orchestrating handoffs between specialized agents, Kratos uses one agent and many skills —
          the simplest shape that still scales across personas and capabilities.
        </p>
        <div className="feature-grid">
          {PILLARS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="feature-card">
                <div className="ic"><Icon size={18} /></div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="callout">
        <div className="ic"><Boxes size={20} /></div>
        <div>
          <h3>How persona generation works</h3>
          <p>
            Your description becomes a threadlight-compatible persona manifest, imported into Kratos
            deterministically and opened live. Explore the source on{' '}
            <a href={KRATOS_REPO} target="_blank" rel="noreferrer">github.com/kmavrodis/kratos-agent</a>.
          </p>
        </div>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Ready to build your own?</div>
        <h2>From experiencing to building</h2>
        <p className="lede">
          Kratos is the <em>experience</em> lane — try the loop live, no setup. When you're ready to build your own version, take one of the three on-ramps.
        </p>
        <div className="kratos-next-grid">
          <Link to="/scenarios" className="kratos-next-card">
            <Layers size={18} />
            <h3>Start from a scenario</h3>
            <p>Fork a proven, industry-shaped blueprint and adapt it. <span className="kratos-next-go">Scenarios <ArrowRight size={13} /></span></p>
          </Link>
          <Link to="/playbooks" className="kratos-next-card">
            <BookOpen size={18} />
            <h3>Learn a technique</h3>
            <p>Master grounding, orchestration, governance, or voice step by step. <span className="kratos-next-go">Playbooks <ArrowRight size={13} /></span></p>
          </Link>
          <Link to="/#prompt" className="kratos-next-card">
            <Sparkles size={18} />
            <h3>Build from a prompt</h3>
            <p>Describe a novel idea and let Copilot scaffold it from scratch. <span className="kratos-next-go">Home <ArrowRight size={13} /></span></p>
          </Link>
        </div>
      </section>
    </>
  );
}
