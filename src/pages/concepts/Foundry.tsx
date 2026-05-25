import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Brain, ImageIcon, Volume2, Headphones, MessagesSquare, FileSearch, BookOpen,
  ExternalLink, DollarSign, FileText,
} from 'lucide-react';

const CAPABILITIES = [
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
    id: 'knowledge',
    icon: BookOpen,
    name: 'Knowledge',
    short: 'Vector grounding, RAG, and knowledge connectors',
    body: `Foundry's Knowledge stack combines Azure AI Search (hybrid vector + keyword), agent-native knowledge sources (SharePoint, OneDrive, web, Fabric OneLake), and a managed indexing pipeline so retrieval-augmented agents ship without you stitching together five services. Citations, scoring, and freshness signals flow back into traces.`,
    bullets: [
      'Hybrid vector + BM25 + semantic ranker in one query',
      'Managed connectors for SharePoint, OneDrive, web, Fabric',
      'Chunking, embedding, and reindexing as a service',
      'Citation-grounded answers with confidence and freshness',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/ai-services/ai-search',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/search/',
      docs: 'https://learn.microsoft.com/en-us/azure/search/',
    },
  },
];

export default function Foundry() {
  const { hash } = useLocation();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [hash]);

  return (
    <>
      <div className="page-head">
        <div className="page-eyebrow">Platform · Microsoft Foundry</div>
        <h1>The agent factory — running on Azure.</h1>
        <p className="lede">
          <strong>Microsoft Foundry</strong> is the unified platform for building, deploying, and operating AI agents at enterprise scale. It bundles a Model Catalog of frontier and open-source models, a hosted agent runtime with skills and tools, managed knowledge & retrieval, content safety, evaluations, observability, and governance — all wired to your Entra tenant and Azure subscription so security, networking, and billing just work. Learn more at{' '}
          <a href="https://azure.microsoft.com/en-us/products/ai-foundry/" target="_blank" rel="noreferrer">azure.microsoft.com/ai-foundry</a>.
        </p>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Capabilities</div>
        <h2>What you can compose</h2>
        <p>Each capability below is a first-class building block in Foundry — production-ready, governed, and observable from day one.</p>

        <div className="platform-grid">
          {CAPABILITIES.map(c => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                id={c.id}
                className={`platform-card ${activeId === c.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
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
          })}
        </div>
      </section>
    </>
  );
}
