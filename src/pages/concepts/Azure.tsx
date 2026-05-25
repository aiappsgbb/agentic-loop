import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Eye, Plug, Waypoints, KeyRound, Network, Database, HardDrive,
  ExternalLink, DollarSign, FileText,
} from 'lucide-react';

const BLOCKS = [
  {
    id: 'observability',
    icon: Eye,
    name: 'Observability',
    short: 'Azure Monitor, Application Insights, Log Analytics',
    body: `Azure Monitor unifies metrics, distributed traces, and logs into a single queryable lake. Application Insights instruments your agents, tools, and skills with OpenTelemetry so every prompt, tool call, token, and eval result is correlated end-to-end. Log Analytics gives you KQL across the whole stack — answer "which tool call regressed last Tuesday?" in seconds.`,
    bullets: [
      'OpenTelemetry-native traces for agents, skills, and tools',
      'Live metrics, alerting, and workbooks tailored to AI workloads',
      'KQL queries across logs, traces, and evals',
      'Continuous eval pipelines that compare prod vs. golden sets',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/monitor',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/monitor/',
      docs: 'https://learn.microsoft.com/en-us/azure/azure-monitor/',
    },
  },
  {
    id: 'integration',
    icon: Plug,
    name: 'Integration',
    short: 'Logic Apps, API Management, Event Grid, Service Bus',
    body: `Agents only matter when they reach the rest of your business. Azure's integration fabric — Logic Apps for connector-driven workflows, API Management for governed API exposure, Event Grid and Service Bus for asynchronous messaging — lets agents call SAP, Salesforce, ServiceNow, Dynamics, mainframes, and bespoke APIs without bespoke plumbing.`,
    bullets: [
      '1,400+ Logic Apps connectors to SaaS and on-prem systems',
      'API Management for versioning, rate limits, and developer portals',
      'Event Grid + Service Bus for resilient async tool calls',
      'On-prem Data Gateway for hybrid reach without VPN tunnels',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/logic-apps',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/logic-apps/',
      docs: 'https://learn.microsoft.com/en-us/azure/logic-apps/',
    },
  },
  {
    id: 'ai-gateway',
    icon: Waypoints,
    name: 'AI Gateway',
    short: 'API Management policies for AI traffic',
    body: `Put an AI Gateway in front of every model and agent endpoint to centralize routing, token-based rate limits, semantic caching, prompt logging, content safety enforcement, and cost attribution per app or tenant. Azure API Management ships purpose-built GenAI policies so you can swap models, fail over regions, and enforce budgets without redeploying agents.`,
    bullets: [
      'Token-aware throttling and per-tenant quotas',
      'Semantic caching to cut latency and cost on repeat questions',
      'Centralized prompt/response logging with PII redaction',
      'Multi-region failover and load balancing across model deployments',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/api-management',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/api-management/',
      docs: 'https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities',
    },
  },
  {
    id: 'identity',
    icon: KeyRound,
    name: 'Identity & Access',
    short: 'Microsoft Entra, managed identities, RBAC',
    body: `Microsoft Entra ID is the identity plane for users, agents, and tools. Managed identities mean your agents never carry secrets — they assume an Azure identity and call resources with RBAC-scoped permissions. Conditional Access, MFA, and Privileged Identity Management apply to AI workloads exactly like every other Azure resource.`,
    bullets: [
      'Managed identities — no secrets in code or config',
      'Fine-grained RBAC on Foundry projects, models, and indexes',
      'On-behalf-of (OBO) delegation so agents act as the calling user',
      'Conditional Access, MFA, and PIM for human and service principals',
    ],
    links: {
      official: 'https://www.microsoft.com/en-us/security/business/microsoft-entra',
      pricing: 'https://www.microsoft.com/en-us/security/business/microsoft-entra/pricing',
      docs: 'https://learn.microsoft.com/en-us/entra/identity/',
    },
  },
  {
    id: 'private-net',
    icon: Network,
    name: 'Private Networking',
    short: 'VNet injection, Private Endpoints, Private Link',
    body: `Run every Foundry capability — models, agents, indexes, storage — behind your Azure Virtual Network with Private Endpoints. Traffic stays on the Microsoft backbone, never traverses the public internet, and integrates with your firewalls, NSGs, route tables, and ExpressRoute circuits. Required by regulated industries; available to everyone.`,
    bullets: [
      'Private Endpoints for OpenAI, Search, Storage, Cosmos, and Foundry projects',
      'VNet-injected compute for agent runtimes and skill execution',
      'DNS-private zones for seamless name resolution',
      'ExpressRoute and Site-to-Site VPN for hybrid topologies',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/virtual-network',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/virtual-network/',
      docs: 'https://learn.microsoft.com/en-us/azure/private-link/',
    },
  },
  {
    id: 'data',
    icon: Database,
    name: 'Data Persistence',
    short: 'Cosmos DB, Azure SQL, PostgreSQL, Fabric',
    body: `Agents need state — conversations, memory, audit logs, business records. Azure offers Cosmos DB for globally distributed JSON & vectors, Azure SQL and PostgreSQL for relational data with pgvector, and Microsoft Fabric for analytics-grade OneLake storage. Pick the engine that matches your access pattern; all integrate natively with Foundry's data sources.`,
    bullets: [
      'Cosmos DB for NoSQL with native vector search and turn-key replication',
      'Azure SQL Hyperscale and PostgreSQL Flexible Server with pgvector',
      'Microsoft Fabric OneLake for unified analytics and AI grounding',
      'Change feeds and triggers that wake agents on data events',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/cosmos-db',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/cosmos-db/',
      docs: 'https://learn.microsoft.com/en-us/azure/cosmos-db/',
    },
  },
  {
    id: 'storage',
    icon: HardDrive,
    name: 'Storage',
    short: 'Azure Blob, Files, and Disks',
    body: `Azure Storage is the durable substrate for documents, embeddings, model artifacts, conversation transcripts, and generated media. Blob Storage scales to exabytes with hot/cool/archive tiers; Files gives you SMB/NFS shares for legacy workloads; Disks back the VMs and containers running custom skills. Lifecycle policies, immutability locks, and CMK encryption are standard.`,
    bullets: [
      'Blob Storage with hot/cool/archive tiers and lifecycle automation',
      'Customer-managed keys (CMK), double encryption, immutability locks',
      'Native event triggers for indexing pipelines and skill invocations',
      'SFTP, NFSv3, and Data Lake Gen2 hierarchical namespace support',
    ],
    links: {
      official: 'https://azure.microsoft.com/en-us/products/storage/blobs',
      pricing: 'https://azure.microsoft.com/en-us/pricing/details/storage/blobs/',
      docs: 'https://learn.microsoft.com/en-us/azure/storage/',
    },
  },
];

export default function Azure() {
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
        <div className="page-eyebrow">Platform · Microsoft Azure</div>
        <h1>The cloud Foundry is built on.</h1>
        <p className="lede">
          <strong>Microsoft Azure</strong> is the enterprise cloud that hosts every Foundry capability — identity, networking, data, observability, integration, and the runtime itself. The Azure Portal, CLI, and Bicep/Terraform IaC give you a single, governed surface for provisioning, securing, and operating AI workloads alongside the rest of your estate. Get started at{' '}
          <a href="https://azure.microsoft.com/en-us/get-started/azure-portal/" target="_blank" rel="noreferrer">azure.microsoft.com/azure-portal</a>.
        </p>
      </div>

      <section className="concept-section">
        <div className="section-eyebrow">Building blocks</div>
        <h2>What you compose around your agents</h2>
        <p>Every Foundry deployment leans on these Azure primitives. Pick the ones your scenario needs — they all interoperate, they're all governed by the same identity and policy plane, and they all show up in one bill.</p>

        <div className="platform-grid">
          {BLOCKS.map(b => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                id={b.id}
                className={`platform-card ${activeId === b.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(b.id)}
              >
                <div className="platform-card-head">
                  <div className="platform-card-icon"><Icon size={22} /></div>
                  <div>
                    <h3>{b.name}</h3>
                    <div className="platform-card-short">{b.short}</div>
                  </div>
                </div>
                <p>{b.body}</p>
                <ul className="platform-bullets">
                  {b.bullets.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
                <div className="platform-card-links">
                  <a className="platform-card-link" href={b.links.official} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} /> Official page
                  </a>
                  <a className="platform-card-link" href={b.links.pricing} target="_blank" rel="noreferrer">
                    <DollarSign size={13} /> Pricing
                  </a>
                  <a className="platform-card-link" href={b.links.docs} target="_blank" rel="noreferrer">
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
