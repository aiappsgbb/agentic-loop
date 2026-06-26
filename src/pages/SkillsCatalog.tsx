import { useMemo, useState } from 'react';
import {
  Hammer, Rocket, Search, Code2, TestTube2, GitBranch, Workflow,
  ShieldCheck, FileCheck2, Sparkles, BookOpen, Bot, Network, Cloud, Database,
  Eye, BarChart3, Mic, Image as ImageIcon, MessageSquare, KeyRound, Plug,
  RefreshCw, Layers, Wand2, AudioLines, FileSearch, Boxes,
  Code as Github
} from 'lucide-react';

type Phase = 'build' | 'run';

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: typeof Hammer;
  phase: Phase;
  category: string;
  surface: string;
  tags: string[];
}

const SKILLS: Skill[] = [
  // ---------------- BUILD ----------------
  {
    id: 'copilot-workspace',
    name: 'Copilot Workspace',
    description: 'Spec-to-PR workflow that turns a natural-language brief into a full implementation plan and diff for review.',
    icon: Github, phase: 'build', category: 'Authoring',
    surface: 'GitHub Copilot', tags: ['planning', 'PR']
  },
  {
    id: 'copilot-chat',
    name: 'Copilot Chat',
    description: 'In-editor pair programmer with project-aware context, multi-file edits, and inline command suggestions.',
    icon: MessageSquare, phase: 'build', category: 'Authoring',
    surface: 'GitHub Copilot', tags: ['IDE', 'chat']
  },
  {
    id: 'copilot-code-review',
    name: 'Copilot Code Review',
    description: 'Automated reviewer that comments on PRs with refactors, regressions, and style fixes before a human takes over.',
    icon: FileCheck2, phase: 'build', category: 'Quality',
    surface: 'GitHub Copilot', tags: ['PR', 'review']
  },
  {
    id: 'codespaces',
    name: 'Codespaces',
    description: 'Cloud dev containers with the Foundry CLI preinstalled, so every contributor starts from the same baseline.',
    icon: Code2, phase: 'build', category: 'Environment',
    surface: 'GitHub', tags: ['devcontainer', 'cloud']
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    description: 'CI/CD pipelines that run evals, package agents, and ship them to Foundry environments on every merge.',
    icon: Workflow, phase: 'build', category: 'CI/CD',
    surface: 'GitHub', tags: ['pipeline', 'release']
  },
  {
    id: 'foundry-sdk',
    name: 'Foundry SDK',
    description: 'Python and TypeScript clients for declaring agents, tools, datasets, and evaluators as code.',
    icon: Boxes, phase: 'build', category: 'Authoring',
    surface: 'Microsoft Foundry', tags: ['SDK', 'agents']
  },
  {
    id: 'prompt-flow',
    name: 'Prompt Flow',
    description: 'Visual graph for composing prompts, tools, and Python steps with versioning and side-by-side comparisons.',
    icon: GitBranch, phase: 'build', category: 'Authoring',
    surface: 'Microsoft Foundry', tags: ['graph', 'prompts']
  },
  {
    id: 'eval-harness',
    name: 'Eval Harness',
    description: 'Batch evaluator that scores agent outputs against golden sets with groundedness, similarity, and custom metrics.',
    icon: TestTube2, phase: 'build', category: 'Quality',
    surface: 'Microsoft Foundry', tags: ['evals', 'scoring']
  },
  {
    id: 'red-team',
    name: 'Red Team Studio',
    description: 'Library of adversarial prompts and jailbreak suites that probe agents for unsafe or off-policy behaviour.',
    icon: ShieldCheck, phase: 'build', category: 'Safety',
    surface: 'Microsoft Foundry', tags: ['safety', 'jailbreak']
  },
  {
    id: 'prompt-optimizer',
    name: 'Prompt Optimizer',
    description: 'Closed-loop prompt search that mutates instructions and selects winners based on your eval signal.',
    icon: Wand2, phase: 'build', category: 'Quality',
    surface: 'Microsoft Foundry', tags: ['optimization', 'prompts']
  },
  {
    id: 'dataset-curator',
    name: 'Dataset Curator',
    description: 'Pulls production traces into versioned eval datasets and tags failure modes for regression coverage.',
    icon: Layers, phase: 'build', category: 'Quality',
    surface: 'Microsoft Foundry', tags: ['datasets', 'traces']
  },

  // ---------------- RUN ----------------
  {
    id: 'agent-runtime',
    name: 'Agent Runtime',
    description: 'Managed execution engine for hosted, prompt, and code-first agents with autoscaling and warm pools.',
    icon: Rocket, phase: 'run', category: 'Runtime',
    surface: 'Microsoft Foundry', tags: ['hosted', 'autoscale']
  },
  {
    id: 'frontier-models',
    name: 'Frontier Models',
    description: 'Multi-region deployments of GPT, o-series, Claude, Llama and Mistral with quota and rate-limit governance.',
    icon: Sparkles, phase: 'run', category: 'Models',
    surface: 'Microsoft Foundry', tags: ['LLM', 'multi-model']
  },
  {
    id: 'knowledge-index',
    name: 'Knowledge Index',
    description: 'ACL-aware vector + keyword index with hybrid retrieval, freshness windows, and per-tenant isolation.',
    icon: Database, phase: 'run', category: 'Grounding',
    surface: 'Microsoft Foundry', tags: ['RAG', 'retrieval']
  },
  {
    id: 'content-safety',
    name: 'Content Safety',
    description: 'Pre- and post-call filters for hate, sexual, violence, jailbreak, and prompt injection categories.',
    icon: ShieldCheck, phase: 'run', category: 'Safety',
    surface: 'Microsoft Foundry', tags: ['safety', 'filters']
  },
  {
    id: 'observability',
    name: 'Observability',
    description: 'Distributed traces, token spend, and tool-call timelines wired through OpenTelemetry to your APM.',
    icon: Eye, phase: 'run', category: 'Operations',
    surface: 'Microsoft Foundry', tags: ['otel', 'traces']
  },
  {
    id: 'continuous-eval',
    name: 'Continuous Eval',
    description: 'Online sampling of live traffic against your eval suite, with drift alerts and per-feature dashboards.',
    icon: BarChart3, phase: 'run', category: 'Operations',
    surface: 'Microsoft Foundry', tags: ['monitoring', 'metrics']
  },
  {
    id: 'private-networking',
    name: 'Private Networking',
    description: 'Private endpoints, customer-managed keys, and VNet egress so model and data traffic never crosses the public internet.',
    icon: Network, phase: 'run', category: 'Platform',
    surface: 'Microsoft Foundry', tags: ['VNet', 'PE']
  },
  {
    id: 'identity',
    name: 'Identity & Entra',
    description: 'OAuth + Entra ID for both end-user and agent identities, with token exchange to downstream tools.',
    icon: KeyRound, phase: 'run', category: 'Platform',
    surface: 'Microsoft Foundry', tags: ['auth', 'OBO']
  },
  {
    id: 'tool-connectors',
    name: 'Tool Connectors',
    description: 'First-class adapters for OpenAPI, MCP servers, Logic Apps, Functions, and Microsoft 365 actions.',
    icon: Plug, phase: 'run', category: 'Tools',
    surface: 'Microsoft Foundry', tags: ['tools', 'MCP']
  },
  {
    id: 'feedback-loop',
    name: 'Feedback Loop',
    description: 'Captures thumbs, rubric scores, and curated traces back into your training and eval sets automatically.',
    icon: RefreshCw, phase: 'run', category: 'Operations',
    surface: 'Microsoft Foundry', tags: ['feedback', 'loop']
  },
  {
    id: 'realtime-voice',
    name: 'Realtime Voice',
    description: 'Low-latency speech-in / speech-out pipeline with barge-in, language detection, and tool calling mid-turn.',
    icon: AudioLines, phase: 'run', category: 'Multimodal',
    surface: 'Microsoft Foundry', tags: ['STT', 'TTS', 'realtime']
  },
  {
    id: 'speech',
    name: 'Speech',
    description: 'Standalone STT and neural TTS endpoints with custom-voice and pronunciation lexicon support.',
    icon: Mic, phase: 'run', category: 'Multimodal',
    surface: 'Microsoft Foundry', tags: ['STT', 'TTS']
  },
  {
    id: 'vision',
    name: 'Vision & Image Gen',
    description: 'Multimodal understanding plus DALL·E / Imagen generation with safety policies and content provenance.',
    icon: ImageIcon, phase: 'run', category: 'Multimodal',
    surface: 'Microsoft Foundry', tags: ['vision', 'image']
  },
  {
    id: 'document-intelligence',
    name: 'Document Intelligence',
    description: 'Layout, form, and table extraction over PDFs and scans, returning structured JSON ready for grounding.',
    icon: FileSearch, phase: 'run', category: 'Grounding',
    surface: 'Microsoft Foundry', tags: ['OCR', 'forms']
  },
  {
    id: 'state-store',
    name: 'State Store',
    description: 'Durable agent memory backed by Cosmos DB with TTL, per-thread keys, and conversation summarization.',
    icon: Cloud, phase: 'run', category: 'Platform',
    surface: 'Microsoft Foundry', tags: ['memory', 'state']
  },
  {
    id: 'agent-catalog',
    name: 'Agent Catalog',
    description: 'Discoverable registry of internal agents with owners, capabilities, SLAs, and one-click invocation.',
    icon: Bot, phase: 'run', category: 'Runtime',
    surface: 'Microsoft Foundry', tags: ['registry', 'discovery']
  },
];

export default function SkillsCatalog() {
  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | Phase>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(SKILLS.map(s => s.category)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILLS.filter(s => {
      if (phaseFilter !== 'all' && s.phase !== phaseFilter) return false;
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q))
        || s.surface.toLowerCase().includes(q);
    });
  }, [query, phaseFilter, categoryFilter]);

  const buildSkills = filtered.filter(s => s.phase === 'build');
  const runSkills = filtered.filter(s => s.phase === 'run');

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Skills catalog · Reference</div>
        <h1>Every capability the Agentic Loop ships with.</h1>
        <p className="lede">
          The reference you consult while building — browse the building blocks that GitHub Copilot brings to the <strong>build</strong> phase and that Microsoft Foundry brings to the <strong>run</strong> phase. One consistent contract, two sides of the loop.
        </p>
      </div>

      <div className="catalog-toolbar">
        <div className="search-input catalog-search">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search skills, surfaces, or tags"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="chip-group catalog-chips" role="tablist">
          {(['all', 'build', 'run'] as const).map(p => (
            <button
              key={p}
              className={`chip ${phaseFilter === p ? 'active' : ''}`}
              onClick={() => setPhaseFilter(p)}
            >
              {p === 'all' ? 'All phases' : p === 'build' ? 'Build' : 'Run'}
            </button>
          ))}
        </div>
        <div className="chip-group catalog-chips" role="tablist">
          {categories.map(c => (
            <button
              key={c}
              className={`chip ${categoryFilter === c ? 'active' : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="catalog-phase">
        <div className="catalog-phase-head">
          <div className="catalog-phase-icon build"><Hammer size={18} /></div>
          <div>
            <div className="catalog-phase-eyebrow">Build phase</div>
            <h2>GitHub Copilot · authoring, testing, and shipping agents.</h2>
            <p>Everything a developer touches before traffic hits production — from spec to PR to release.</p>
          </div>
          <span className="catalog-count">{buildSkills.length}</span>
        </div>
        {buildSkills.length === 0 ? (
          <div className="catalog-empty">No build skills match your filters.</div>
        ) : (
          <div className="catalog-grid">
            {buildSkills.map(s => <SkillCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="catalog-phase">
        <div className="catalog-phase-head">
          <div className="catalog-phase-icon run"><Rocket size={18} /></div>
          <div>
            <div className="catalog-phase-eyebrow">Run phase</div>
            <h2>Microsoft Foundry · serving, grounding, and governing agents.</h2>
            <p>Everything the agent depends on once it's serving real users — models, data, safety, telemetry, identity.</p>
          </div>
          <span className="catalog-count">{runSkills.length}</span>
        </div>
        {runSkills.length === 0 ? (
          <div className="catalog-empty">No run skills match your filters.</div>
        ) : (
          <div className="catalog-grid">
            {runSkills.map(s => <SkillCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="catalog-cta">
        <BookOpen size={18} />
        <div>
          <strong>New to the catalog?</strong> Start with a playbook — it threads the right skills together for a specific outcome.
        </div>
      </section>
    </>
  );
}

function SkillCard({ s }: { s: Skill }) {
  const Icon = s.icon;
  return (
    <article className={`skill-card phase-${s.phase}`}>
      <div className="skill-card-head">
        <div className="skill-card-icon"><Icon size={18} /></div>
        <span className={`skill-phase-badge ${s.phase}`}>
          {s.phase === 'build' ? 'Build' : 'Run'}
        </span>
      </div>
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <div className="skill-card-foot">
        <span className="skill-surface">{s.surface}</span>
        <span className="skill-dot">·</span>
        <span className="skill-category">{s.category}</span>
      </div>
      <div className="skill-tags">
        {s.tags.map(t => <span key={t} className="skill-tag">{t}</span>)}
      </div>
    </article>
  );
}
