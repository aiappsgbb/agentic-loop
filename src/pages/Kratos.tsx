import { Link } from 'react-router-dom';
import {
  Bot, Boxes, RefreshCw, Cloud, Code2 as Github, Database, Eye, ArrowRight,
  ExternalLink, Plug, Layers, BookOpen, Sparkles,
} from 'lucide-react';
import KratosLauncher from '../components/KratosLauncher';
import PersonaBuilder from '../components/PersonaBuilder';

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

      <section className="kratos-try-builder">
        <PersonaBuilder />
      </section>

      <section className="kratos-gallery-section">
        <div className="section-eyebrow">Or skip the setup</div>
        <h2>Start from a curated persona</h2>
        <p className="lede">
          Not customizing? Pick a ready-made agent below — each one opens live in the embedded
          Kratos app under <code>/kratos</code>, no setup and no extra steps.
        </p>
        <KratosLauncher />
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
