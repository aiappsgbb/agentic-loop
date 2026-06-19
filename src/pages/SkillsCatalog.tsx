import { useMemo, useState } from 'react';
import {
  Hammer, Rocket, Search, Code2, TestTube2, GitBranch, Workflow,
  ShieldCheck, FileCheck2, Sparkles, BookOpen, Bot, Network, Cloud, Database,
  Eye, BarChart3, Mic, Image as ImageIcon, MessageSquare, KeyRound, Plug,
  RefreshCw, Layers, Wand2, AudioLines, FileSearch, Boxes, Award, ExternalLink,
  Code as Github
} from 'lucide-react';

type Phase = 'build' | 'run' | 'gbb';

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

  // ---------------- AWESOME-GBB (unofficial, field-curated) ----------------
  {
    id: 'threadlight-auto',
    name: 'threadlight-auto',
    description: 'One freeform prompt drives the whole pilot pipeline — design → deploy → safe-check, end to end.',
    icon: Workflow, phase: 'gbb', category: 'Pilot delivery',
    surface: 'Threadlight', tags: ['pilot', 'end-to-end']
  },
  {
    id: 'threadlight-design',
    name: 'threadlight-design',
    description: 'Specs a business process into a durable SpecKit spec, then an agent architecture (AGENTS.md + skills).',
    icon: FileSearch, phase: 'gbb', category: 'Pilot delivery',
    surface: 'Threadlight', tags: ['spec', 'architecture']
  },
  {
    id: 'threadlight-deploy',
    name: 'threadlight-deploy',
    description: 'Turns a designed agent project into Foundry Hosted Agent deployment artefacts — Bicep, agent.yaml, azd.',
    icon: Rocket, phase: 'gbb', category: 'Pilot delivery',
    surface: 'Threadlight', tags: ['deploy', 'foundry']
  },
  {
    id: 'threadlight-safe-check',
    name: 'threadlight-safe-check',
    description: 'Three-lifecycle completeness gate (design / pre-deploy / post-deploy) that blocks half-built pilots.',
    icon: ShieldCheck, phase: 'gbb', category: 'Pilot delivery',
    surface: 'Threadlight', tags: ['gate', 'quality']
  },
  {
    id: 'threadlight-local-test',
    name: 'threadlight-local-test',
    description: 'Runs a designed PoC locally without azd up — a quickstart MAF agent with stub tools and a UI.',
    icon: TestTube2, phase: 'gbb', category: 'Pilot delivery',
    surface: 'Threadlight', tags: ['local', 'PoC']
  },
  {
    id: 'threadlight-workspace-ui',
    name: 'threadlight-workspace-ui',
    description: 'Generates a framework-agnostic operator UI — inbox / dashboard / console — for a pilot process.',
    icon: Layers, phase: 'gbb', category: 'Customization',
    surface: 'Threadlight', tags: ['UI', 'operator']
  },
  {
    id: 'threadlight-event-triggers',
    name: 'threadlight-event-triggers',
    description: 'Scaffolds non-interactive trigger receivers (ACA jobs, HTTP, KEDA) so the agent runs on events, not chat.',
    icon: Plug, phase: 'gbb', category: 'Customization',
    surface: 'Threadlight', tags: ['events', 'ACA']
  },
  {
    id: 'threadlight-hitl-patterns',
    name: 'threadlight-hitl-patterns',
    description: 'Teams Adaptive Card flows for the seven canonical human-in-the-loop action gates.',
    icon: MessageSquare, phase: 'gbb', category: 'Customization',
    surface: 'Threadlight', tags: ['Teams', 'HITL']
  },
  {
    id: 'threadlight-demo-data-factory',
    name: 'threadlight-demo-data-factory',
    description: 'Per-domain synthetic data plus Cosmos seed/reset scripts so demos feel real on day one.',
    icon: Database, phase: 'gbb', category: 'Customization',
    surface: 'Threadlight', tags: ['demo', 'data']
  },
  {
    id: 'foundry-hosted-agents',
    name: 'foundry-hosted-agents',
    description: 'Deploy and manage Foundry hosted agents — code deploy-mode, agent manifest, identity roles, WS invocations.',
    icon: Bot, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['hosted', 'deploy']
  },
  {
    id: 'foundry-prompt-agents',
    name: 'foundry-prompt-agents',
    description: 'Declarative prompt agents — a model, instructions, and tools, with no containers or custom code.',
    icon: Sparkles, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['declarative', 'prompt']
  },
  {
    id: 'foundry-evals',
    name: 'foundry-evals',
    description: 'Score hosted agents with the two-phase invoke+score pattern and Foundry built-in evaluators.',
    icon: BarChart3, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['evals', 'scoring']
  },
  {
    id: 'foundry-observability',
    name: 'foundry-observability',
    description: 'End-to-end OpenTelemetry across hosted agents, ACA MCP servers, jobs, bots, and workspace UIs.',
    icon: Eye, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['otel', 'traces']
  },
  {
    id: 'foundry-mcp-aca',
    name: 'foundry-mcp-aca',
    description: 'Deploy custom MCP servers as Azure Container Apps or Functions for use with Foundry hosted agents.',
    icon: Network, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['MCP', 'ACA']
  },
  {
    id: 'foundry-voice-live',
    name: 'foundry-voice-live',
    description: 'Real-time voice agents on Foundry Voice Live — a three-rung migration ladder from OpenAI Realtime.',
    icon: AudioLines, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['voice', 'realtime']
  },
  {
    id: 'foundry-memory',
    name: 'foundry-memory',
    description: 'Persistent agent memory across sessions — user profiles, summaries, semantic retrieval, scope isolation.',
    icon: RefreshCw, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['memory', 'state']
  },
  {
    id: 'foundry-iq',
    name: 'foundry-iq',
    description: 'Enterprise RAG via Foundry IQ — Knowledge Bases with agentic, multi-hop, citation-backed retrieval.',
    icon: FileSearch, phase: 'gbb', category: 'Foundry agents',
    surface: 'Foundry GBB', tags: ['RAG', 'retrieval']
  },
  {
    id: 'foundry-agt',
    name: 'foundry-agt',
    description: 'Wrap the Agent Governance Toolkit around agents and MCP servers — policy enforcement + hash-chained audit.',
    icon: ShieldCheck, phase: 'gbb', category: 'Governance',
    surface: 'Foundry GBB', tags: ['governance', 'audit']
  },
  {
    id: 'citadel-hub-deploy',
    name: 'citadel-hub-deploy',
    description: 'Stand up the AI Citadel Governance Hub — APIM AI gateway, Foundry control plane, telemetry, private endpoints.',
    icon: Cloud, phase: 'gbb', category: 'Governance',
    surface: 'AI Citadel', tags: ['citadel', 'gateway']
  },
  {
    id: 'citadel-spoke-onboarding',
    name: 'citadel-spoke-onboarding',
    description: 'Onboard a Foundry project as a Citadel spoke — access contracts, APIM connections, product policies, JWT auth.',
    icon: Network, phase: 'gbb', category: 'Governance',
    surface: 'AI Citadel', tags: ['citadel', 'spoke']
  },
  {
    id: 'azure-sre-agent',
    name: 'azure-sre-agent',
    description: 'Adopt the Azure SRE Agent in GBB engagements without rebuilding the toolchain Microsoft already ships.',
    icon: Bot, phase: 'gbb', category: 'Governance',
    surface: 'GBB Toolkit', tags: ['SRE', 'ops']
  },
  {
    id: 'azure-tenant-isolation',
    name: 'azure-tenant-isolation',
    description: 'Multi-tenant az / azd isolation for concurrent terminals, with a guard against cross-tenant deploys.',
    icon: KeyRound, phase: 'gbb', category: 'Governance',
    surface: 'GBB Toolkit', tags: ['multi-tenant', 'safety']
  },
  {
    id: 'azd-patterns',
    name: 'azd-patterns',
    description: 'Field-tested azd patterns — hooks, ACA job deploys, and infra scripting conventions that just work.',
    icon: GitBranch, phase: 'gbb', category: 'Governance',
    surface: 'GBB Toolkit', tags: ['azd', 'infra']
  },
  {
    id: 'gbb-pptx',
    name: 'gbb-pptx',
    description: 'Generate professional GBB-styled PowerPoint pitch decks programmatically with python-pptx.',
    icon: ImageIcon, phase: 'gbb', category: 'GTM',
    surface: 'GBB Toolkit', tags: ['pptx', 'deck']
  },
  {
    id: 'gbb-humanizer',
    name: 'gbb-humanizer',
    description: "Strip AI-writing tells from prose — 29 patterns from Wikipedia's “Signs of AI writing.”",
    icon: Wand2, phase: 'gbb', category: 'GTM',
    surface: 'GBB Toolkit', tags: ['writing', 'editing']
  },
  {
    id: 'ip-catalog',
    name: 'ip-catalog',
    description: 'Search the AI Apps GBB IP catalog — demos, accelerators, and reusable assets — via an MCP server.',
    icon: BookOpen, phase: 'gbb', category: 'GTM',
    surface: 'GBB Toolkit', tags: ['catalog', 'IP']
  },
  {
    id: 'paygo-ptu-cost-analyzer',
    name: 'paygo-ptu-cost-analyzer',
    description: 'Headless Azure OpenAI PAYGO-vs-PTU cost analysis and sizing report from token-usage data.',
    icon: BarChart3, phase: 'gbb', category: 'GTM',
    surface: 'GBB Toolkit', tags: ['cost', 'sizing']
  },
];

/** Official documentation for the platform-capability cards (Build + Run).
 *  These aren't installable skills — they're GitHub Copilot / Microsoft Foundry
 *  product features, so each links to its canonical docs page (all verified live). */
const DOC_URLS: Record<string, string> = {
  // Build · GitHub Copilot + Foundry authoring
  'copilot-workspace': 'https://docs.github.com/en/copilot/using-github-copilot/coding-agent',
  'copilot-chat': 'https://docs.github.com/en/copilot/using-github-copilot/copilot-chat',
  'copilot-code-review': 'https://docs.github.com/en/copilot/using-github-copilot/code-review/using-copilot-code-review',
  'codespaces': 'https://docs.github.com/en/codespaces/overview',
  'github-actions': 'https://docs.github.com/en/actions',
  'foundry-sdk': 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/sdk-overview',
  'prompt-flow': 'https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/overview-what-is-prompt-flow',
  'eval-harness': 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/evaluation-approach-gen-ai',
  'red-team': 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/ai-red-teaming-agent',
  'prompt-optimizer': 'https://learn.microsoft.com/azure/foundry/observability/how-to/prompt-optimizer',
  'dataset-curator': 'https://learn.microsoft.com/azure/foundry/observability/how-to/traces-to-dataset',
  // Run · Microsoft Foundry runtime
  'agent-runtime': 'https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview',
  'frontier-models': 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/model-catalog-overview',
  'knowledge-index': 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/index-add',
  'content-safety': 'https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview',
  'observability': 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/observability',
  'continuous-eval': 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/continuous-evaluation-agents',
  'private-networking': 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/configure-private-link',
  'identity': 'https://learn.microsoft.com/en-us/entra/fundamentals/whatis',
  'tool-connectors': 'https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools/overview',
  'feedback-loop': 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/evaluation-evaluators/agent-evaluators',
  'realtime-voice': 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live',
  'speech': 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview',
  'vision': 'https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview',
  'document-intelligence': 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview',
  'state-store': 'https://learn.microsoft.com/en-us/azure/ai-foundry/agents/concepts/threads-runs-messages',
  'agent-catalog': 'https://learn.microsoft.com/en-us/azure/ai-foundry/what-is-azure-ai-foundry',
};

/** Where a card points: GBB skills → their SKILL.md source; Build/Run → official product docs. */
function skillSource(s: Skill): string | undefined {
  if (s.phase === 'gbb') {
    const repo = s.id.startsWith('threadlight-')
      ? 'aiappsgbb/threadlight-skills'
      : 'aiappsgbb/awesome-gbb';
    return `https://github.com/${repo}/blob/main/skills/${s.id}/SKILL.md`;
  }
  return DOC_URLS[s.id];
}

const PHASE_META: Record<Phase, { icon: typeof Hammer; eyebrow: string; title: string; blurb: string; linkNote?: string }> = {
  build: {
    icon: Hammer,
    eyebrow: 'Build phase',
    title: 'GitHub Copilot · authoring, testing, and shipping agents.',
    blurb: 'Everything a developer touches before traffic hits production — from spec to PR to release.',
    linkNote: 'Platform capabilities — click any card to open its official GitHub or Foundry documentation.',
  },
  run: {
    icon: Rocket,
    eyebrow: 'Run phase',
    title: 'Microsoft Foundry · serving, grounding, and governing agents.',
    blurb: "Everything the agent depends on once it's serving real users — models, data, safety, telemetry, identity.",
    linkNote: 'Platform capabilities — click any card to open its official Microsoft Foundry documentation.',
  },
  gbb: {
    icon: Award,
    eyebrow: 'awesome-gbb · unofficial',
    title: 'Field-curated specialist skills, built by GBB.',
    blurb: 'The flagship motions the playbooks lean on — Threadlight pilots, Foundry hosted agents, and AI Citadel governance — packaged as named skills you invoke by prompt.',
  },
};

const TAB_LABEL: Record<Phase, string> = { build: 'Build', run: 'Run', gbb: 'GBB-curated' };

export default function SkillsCatalog() {
  const [tab, setTab] = useState<Phase>('build');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const phaseCounts = useMemo(() => ({
    build: SKILLS.filter(s => s.phase === 'build').length,
    run: SKILLS.filter(s => s.phase === 'run').length,
    gbb: SKILLS.filter(s => s.phase === 'gbb').length,
  }), []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(SKILLS.filter(s => s.phase === tab).map(s => s.category)))],
    [tab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILLS.filter(s => {
      if (s.phase !== tab) return false;
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q))
        || s.surface.toLowerCase().includes(q);
    });
  }, [query, tab, categoryFilter]);

  function selectTab(p: Phase) {
    setTab(p);
    setCategoryFilter('All');
  }

  const meta = PHASE_META[tab];
  const MetaIcon = meta.icon;

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Skills catalog · Reference</div>
        <h1>Every capability the Agentic Loop ships with.</h1>
        <p className="lede">
          The reference you consult while building — the building blocks that GitHub Copilot brings to the <strong>build</strong> phase, that Microsoft Foundry brings to the <strong>run</strong> phase, plus a field-curated set of specialist <strong>GBB</strong> skills. Pick a tab to explore each group — every card links out to its official source.
        </p>
      </div>

      <div className="catalog-tabs" role="tablist">
        {(['build', 'run', 'gbb'] as const).map(p => {
          const TabIcon = PHASE_META[p].icon;
          return (
            <button
              key={p}
              role="tab"
              aria-selected={tab === p}
              className={`catalog-tab accent-${p} ${tab === p ? 'active' : ''}`}
              onClick={() => selectTab(p)}
            >
              <TabIcon size={16} />
              <span>{TAB_LABEL[p]}</span>
              <span className="catalog-tab-count">{phaseCounts[p]}</span>
            </button>
          );
        })}
      </div>

      <section className="catalog-phase">
        <div className="catalog-phase-intro">
          <div className={`catalog-phase-icon ${tab}`}><MetaIcon size={18} /></div>
          <div>
            <div className="catalog-phase-eyebrow">{meta.eyebrow}</div>
            <h2>{meta.title}</h2>
            <p>{meta.blurb}</p>
            {meta.linkNote && (
              <p className="catalog-link-note">
                <ExternalLink size={13} /> <span>{meta.linkNote}</span>
              </p>
            )}
          </div>
        </div>

        {tab === 'gbb' && (
          <p className="catalog-gbb-disclaimer">
            <Award size={14} /> <span><strong>Community, not a product.</strong> These are unofficial, GBB-curated skills — battle-tested in the field for specialized agentic scenarios, but not Microsoft-supported offerings. Drive them the same way as any skill: name it in your prompt (e.g. <em>“Use the threadlight-auto skill to…”</em>). Click any card to open its <code>SKILL.md</code> source.</span>
          </p>
        )}

        <div className="catalog-toolbar">
          <div className="search-input catalog-search">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder={`Search ${TAB_LABEL[tab]} skills, surfaces, or tags`}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
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

        {filtered.length === 0 ? (
          <div className="catalog-empty">No {TAB_LABEL[tab]} skills match your filters.</div>
        ) : (
          <div className="catalog-grid">
            {filtered.map(s => <SkillCard key={s.id} s={s} />)}
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
  const source = skillSource(s);
  const body = (
    <>
      <div className="skill-card-head">
        <div className="skill-card-icon"><Icon size={18} /></div>
        <div className="skill-card-head-right">
          <span className={`skill-phase-badge ${s.phase}`}>
            {s.phase === 'build' ? 'Build' : s.phase === 'run' ? 'Run' : 'GBB'}
          </span>
          {source && <ExternalLink className="skill-card-link-icon" size={14} />}
        </div>
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
    </>
  );

  if (source) {
    return (
      <a
        className={`skill-card phase-${s.phase} is-link`}
        href={source}
        target="_blank"
        rel="noreferrer"
        aria-label={s.phase === 'gbb'
          ? `Open ${s.name} SKILL.md source on GitHub`
          : `Open ${s.name} documentation`}
      >
        {body}
      </a>
    );
  }
  return <article className={`skill-card phase-${s.phase}`}>{body}</article>;
}
