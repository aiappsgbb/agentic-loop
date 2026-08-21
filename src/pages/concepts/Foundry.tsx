import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Brain, ImageIcon, Volume2, Headphones, MessagesSquare, FileSearch, BookOpen,
  ExternalLink, DollarSign, FileText, Bot, Boxes, FlaskConical, Activity,
  Briefcase, Network,
} from 'lucide-react';

// The IQ layer is what an agent knows. It comes first on this page on purpose:
// models and modalities are commodities, grounded context is the differentiator.
const IQ_LAYER = [
  {
    id: 'foundry-iq',
    icon: BookOpen,
    name: 'Foundry IQ',
    short: 'Knowledge IQ — documents, policies, and grounded retrieval',
    body: `Foundry IQ is the knowledge layer: one managed knowledge base your agents query instead of you hand-rolling a RAG pipeline per project. It sits on Azure AI Search — hybrid vector + keyword + semantic ranking — and adds agentic retrieval: the service plans the query, fans out across sources, and returns ranked, cited passages. Connect SharePoint, OneDrive, Blob, the web, or Fabric OneLake once, attach the knowledge base to any agent over MCP, and every answer comes back with citations and freshness signals that flow into your traces.`,
    bullets: [
      'One knowledge base, reused across agents — no per-project RAG plumbing',
      'Agentic retrieval: automatic query planning and multi-source fan-out',
      'Hybrid vector + BM25 + semantic ranker on Azure AI Search',
      'Managed connectors, chunking, embedding, and reindexing as a service',
      'Citation-grounded answers with confidence and freshness in traces',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/iq/',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/search/',
      docs: 'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect',
    },
  },
  {
    id: 'work-iq',
    icon: Briefcase,
    name: 'Work IQ',
    short: 'Work IQ — how your organisation actually works',
    body: `Work IQ is the organisational memory layer over Microsoft 365. It carries the signals no document store holds: who works with whom, which meeting a decision came out of, what thread a commitment lives in, which artefacts matter to this person right now. Agents built on Work IQ stop answering generically and start answering in the context of your company — the right stakeholder, the right prior decision, the right next action — under the same Entra permissions and compliance boundary as the underlying content.`,
    bullets: [
      'Signals from mail, Teams, meetings, documents, and collaboration graphs',
      'People, relationships, and workflow context — not just file contents',
      'Trims and personalises grounding per user before the model sees it',
      'Honours Microsoft 365 permissions, sensitivity labels, and compliance',
    ],
    links: {
      official: 'https://www.microsoft.com/en-us/microsoft-365/copilot',
      pricing: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/microsoft365-plans-and-pricing',
      docs: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/work-iq',
    },
  },
  {
    id: 'fabric-iq',
    icon: Network,
    name: 'Fabric IQ',
    short: 'Fabric IQ — business semantics over your operational data',
    body: `Fabric IQ is the semantic layer over Microsoft Fabric. It maps raw tables into business ontologies — Customer, Order, Revenue, Asset — with the metric definitions and relationships your business already agreed on. That means an agent asking "what's churn this quarter" resolves it exactly the way finance does, not by guessing at column names. One definition of a KPI, shared by dashboards, reports, and every agent that queries it.`,
    bullets: [
      'Business ontologies and shared metric definitions over OneLake',
      'Consistent KPI semantics across agents, reports, and analytics',
      'Real-time and historical operational data from one governed lake',
      'Agents reason over entities and relationships, not raw tables',
    ],
    links: {
      official: 'https://www.microsoft.com/en-us/microsoft-fabric',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/',
      docs: 'https://learn.microsoft.com/en-us/fabric/iq/overview',
    },
  },
];

const CAPABILITIES = [
  {
    id: 'hosted-agents',
    icon: Bot,
    name: 'Hosted Agents',
    short: 'Managed runtime for your agent loop, exposed as an API',
    body: `Hosted Agents are the runtime half of the Agentic Loop. You package your agent — the GitHub Copilot SDK loop, its skills and its tools — as a container declared in agent.yaml, and Foundry runs it as a managed, identity-bound resource that exposes the Responses API. No AKS to operate, no gateway to build: scaling, versioning, threads, and state come with the platform, while the agent's behaviour stays plain code in your repo.`,
    bullets: [
      'Container-backed agents declared in agent.yaml, deployed with azd',
      'Responses API endpoint by default — one contract for every client',
      'Managed threads, state, and conversation persistence',
      'Entra-bound managed identity, VNet injection, and per-agent RBAC',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/agent-service',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/ai-foundry/',
      docs: 'https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/hosted-agents',
    },
  },
  {
    id: 'frontier-models',
    icon: Brain,
    name: 'Frontier Models',
    short: 'GPT, Claude, Llama, Phi, Mistral, o-series',
    body: `Foundry's Model Catalog gives you one-click access to hundreds of frontier and open-source models — Azure OpenAI GPT-4o and o-series, Anthropic Claude, Meta Llama, Microsoft Phi, Mistral, Cohere, and more. Models are deployed as serverless endpoints with regional placement, content safety, quota management, and per-token cost reporting. Compare models side-by-side on your own evals before promoting to production.`,
    bullets: [
      'Serverless and Provisioned Throughput Units (PTUs) deployment modes',
      'Unified inference API across vendors via Foundry SDK',
      'Built-in safety scaffolding and prompt shields',
      'Side-by-side eval and A/B routing for model selection',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/models',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/phi/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/foundry-models-overview',
    },
  },
  {
    id: 'image-generation',
    icon: ImageIcon,
    name: 'Image Generation',
    short: 'DALL·E 3, GPT-Image-1, Stable Diffusion',
    body: `Generate, edit, and vary images at production quality with DALL·E 3, GPT-Image-1 and partner diffusion models hosted in Foundry. Use prompt-to-image for marketing assets, image-to-image for product mockups, or inpainting for surgical edits. All outputs flow through the same content safety filters and cost reporting as text models.`,
    bullets: [
      'High-fidelity prompt-to-image with style controls',
      'Inpainting, outpainting, and image variations',
      'Brand-safe content filters and prompt rewriting',
      'Direct hand-off to Azure Blob Storage with SAS-scoped URLs',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/dall-e-quickstart',
    },
  },
  {
    id: 'text-to-speech',
    icon: Volume2,
    name: 'Text to Speech',
    short: 'Neural voices, custom voice, SSML',
    body: `Azure AI Speech ships hundreds of neural voices across 140+ locales, with SSML controls for prosody, style, and emotion. Train a Custom Neural Voice that sounds like your brand or a specific persona, with responsible-AI gating built in. Stream synthesis straight into a phone line, a browser tab, or an avatar.`,
    bullets: [
      '140+ languages and locales out of the box',
      'Multi-style and multi-emotion voices for narration & IVR',
      'Custom Neural Voice with consent-based onboarding',
      'Low-latency streaming for real-time agents',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-services/ai-speech',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech',
    },
  },
  {
    id: 'speech-to-text',
    icon: Headphones,
    name: 'Speech to Text',
    short: 'Real-time transcription, diarization, custom models',
    body: `Real-time and batch speech recognition with speaker diarization, profanity filtering, and confidence scoring. Customize acoustic and language models on your own jargon — product names, drug names, internal codes — so your agents transcribe what your business actually talks about.`,
    bullets: [
      'Sub-second real-time streaming transcription',
      'Speaker diarization and language identification',
      'Custom Speech models for domain vocabulary',
      'Batch transcription with WebVTT/SRT output',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-services/ai-speech',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text',
    },
  },
  {
    id: 'realtime',
    icon: MessagesSquare,
    name: 'Real-Time Conversations',
    short: 'Voice-first agents on the Realtime API',
    body: `The Realtime API in Foundry collapses STT → reasoning → TTS into a single bidirectional stream, so voice agents respond in hundreds of milliseconds with natural turn-taking and barge-in. Pair it with Communication Services to plug into phone numbers, Teams meetings, and WebRTC clients without writing media pipelines.`,
    bullets: [
      'Single duplex stream — no STT/TTS plumbing',
      'Natural interruptions, barge-in, and turn detection',
      'Function calling and tool use mid-conversation',
      'Teams, PSTN, and WebRTC connectors via Communication Services',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/voice-live',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-quickstart',
    },
  },
  {
    id: 'forms',
    icon: FileSearch,
    name: 'Forms Recognition',
    short: 'Document intelligence for invoices, contracts, IDs',
    body: `Document Intelligence (formerly Form Recognizer) extracts structured data from PDFs, scans, and images — invoices, receipts, IDs, contracts, tax forms — using prebuilt models, custom-trained models, or layout-only mode for general OCR. Outputs are clean JSON ready to feed an agent's tools.`,
    bullets: [
      'Prebuilt models for invoices, receipts, IDs, and W-2/1099s',
      'Custom models trained on as few as 5 samples',
      'Layout, key-value, table, and selection-mark extraction',
      'High-volume async batch with VNet-injected endpoints',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-services/ai-document-intelligence',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/ai-document-intelligence/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/',
    },
  },
  {
    id: 'extensibility',
    icon: Boxes,
    name: 'Extensibility',
    short: 'Toolbox, MCP, OpenAPI, and A2A tools',
    body: `Foundry lets an agent reach anything your business already runs. Built-in tools, remote MCP servers, OpenAPI-described APIs, and A2A agents are curated into a Toolbox — a versioned bundle exposed as a single MCP endpoint with centralized auth, policy, and discovery. Ship a candidate version, test it, then promote it to the consumer default without touching agent code.`,
    bullets: [
      'Toolbox: one versioned MCP endpoint for a governed tool set',
      'Remote MCP servers, OpenAPI tools, and A2A agent-to-agent calls',
      'Centralized credentials, network policy, and per-tool RBAC',
      'Version → test → promote flow so tool changes are non-breaking',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/agent-service',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/ai-foundry/',
      docs: 'https://learn.microsoft.com/azure/foundry/agents/how-to/tools/toolbox',
    },
  },
  {
    id: 'evaluations',
    icon: FlaskConical,
    name: 'Evaluations',
    short: 'Quality, safety, and regression gates before you ship',
    body: `Evaluations turn "it felt better" into evidence. Run built-in graders for groundedness, relevance, coherence, and retrieval quality, plus safety evaluators for violence, hate, self-harm, and jailbreak susceptibility — against your own datasets or live traces. Wire the same eval into CI so every prompt, model, or tool change is scored before it reaches users, and continuously in production for drift.`,
    bullets: [
      'Built-in quality graders and AI-assisted, custom evaluators',
      'Risk & safety evaluators plus automated adversarial red-teaming',
      'Dataset, batch, and CI/CD-gated runs via the Foundry SDK',
      'Continuous online evaluation on sampled production traces',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/ai-foundry/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/evaluation-approach-gen-ai',
    },
  },
  {
    id: 'observability',
    icon: Activity,
    name: 'Observability',
    short: 'OpenTelemetry tracing, metrics, and cost per run',
    body: `Every agent run emits OpenTelemetry traces — the model calls, the tool invocations, the retrieved documents, the token counts and the latency at each hop — into Application Insights and Azure Monitor. Replay a single conversation to see exactly which skill fired and why, alert on error rate or p95 latency, and attribute spend per agent, per model, per customer.`,
    bullets: [
      'OpenTelemetry GenAI semantic conventions, no custom instrumentation',
      'Full run replay: prompts, tool calls, citations, and outputs',
      'App Insights / Azure Monitor dashboards, KQL, and alerting',
      'Token, latency, and cost attribution per agent and per model',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-foundry/',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/monitor/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/observability',
    },
  },
];

type Capability = (typeof CAPABILITIES)[number];

function CapabilityCard({ c, active, onSelect }: { c: Capability; active: boolean; onSelect: () => void }) {
  const Icon = c.icon;
  return (
    <div id={c.id} className={`platform-card ${active ? 'is-active' : ''}`} onClick={onSelect}>
      <div className="platform-card-head">
        <div className="platform-card-icon"><Icon size={22} /></div>
        <div>
          <h3>{c.name}</h3>
          <div className="platform-card-short">{c.short}</div>
        </div>
      </div>
      <p>{c.body}</p>
      <ul className="platform-bullets">
        {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <div className="platform-card-links">
        <a className="platform-card-link" href={c.links.official} target="_blank" rel="noreferrer">
          <ExternalLink size={13} /> Official page
        </a>
        <a className="platform-card-link" href={c.links.pricing} target="_blank" rel="noreferrer">
          <DollarSign size={13} /> Pricing
        </a>
        <a className="platform-card-link" href={c.links.docs} target="_blank" rel="noreferrer">
          <FileText size={13} /> Documentation
        </a>
      </div>
    </div>
  );
}

export default function Foundry() {
  const { hash } = useLocation();
  const hashId = hash ? hash.replace('#', '') : null;
  const [selectedId, setSelectedId] = useState<string | null>(() => hashId);
  const activeId = selectedId ?? hashId;

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [hash]);

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Platform · Microsoft Foundry</div>
        <h1>The agent factory — running on Azure.</h1>
        <p className="lede">
          <strong>Microsoft Foundry</strong> is the unified platform for building, deploying, and operating AI agents at enterprise scale. It bundles the <strong>IQ layer</strong> that grounds agents in your knowledge, your work, and your data; a Model Catalog of frontier and open-source models; a hosted agent runtime with skills and tools; plus content safety, evaluations, observability, and governance — all wired to your Entra tenant and Azure subscription so security, networking, and billing just work. Learn more at{' '}
          <a href="https://azure.microsoft.com/en-us/products/ai-foundry/" target="_blank" rel="noreferrer">azure.microsoft.com/ai-foundry</a>.
        </p>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">The IQ layer</div>
        <h2>Context is the differentiator, not the model.</h2>
        <p>
          Any team can call a frontier model. What separates a demo from a system of record is what the agent
          <em> knows</em>. Microsoft's IQ layer supplies that context in three complementary planes — your institutional
          knowledge, how your organisation actually works, and what your business data means — each governed, permission-trimmed,
          and composable. Ground an agent in one, or in all three.
        </p>

        <div className="platform-grid">
          {IQ_LAYER.map(c => (
            <CapabilityCard key={c.id} c={c} active={activeId === c.id} onSelect={() => setSelectedId(c.id)} />
          ))}
        </div>
      </section>

      <section className="concept-section">
        <div className="section-eyebrow">Capabilities</div>
        <h2>What you can compose</h2>
        <p>With grounding in place, these are the building blocks you assemble around it — production-ready, governed, and observable from day one.</p>

        <div className="platform-grid">
          {CAPABILITIES.map(c => (
            <CapabilityCard key={c.id} c={c} active={activeId === c.id} onSelect={() => setSelectedId(c.id)} />
          ))}
        </div>
      </section>
    </>
  );
}
