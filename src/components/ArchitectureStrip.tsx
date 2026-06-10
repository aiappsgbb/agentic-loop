import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  Database,
  Eye,
  KeyRound,
  Network,
  Plug,
  Sparkles,
  ShieldCheck,
  Waypoints,
  Wrench,
} from 'lucide-react';

type ArchitectureVariant = 'compact' | 'full';
type ArchitectureWeight = 'spine' | 'complementary' | 'foundation';
type BrandIconName = 'copilot-sdk' | 'hosted-agent' | 'foundry-models';

interface ArchitectureNode {
  id: string;
  label: string;
  caption: string;
  href: string;
  icon: LucideIcon;
  weight: ArchitectureWeight;
  brandIcon?: BrandIconName;
}

const SPINE_NODES: ArchitectureNode[] = [
  {
    id: 'github-copilot-sdk',
    label: 'GitHub Copilot SDK',
    caption: 'Agent Loop runtime that binds skills, tools, and model calls.',
    href: '/concepts/agentic-loop',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'copilot-sdk',
  },
  {
    id: 'hosted-agent',
    label: 'Hosted Agent',
    caption: 'Foundry runtime where skills execute and tools are invoked under policy.',
    href: '/concepts/agents',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'hosted-agent',
  },
  {
    id: 'foundry-model',
    label: 'Foundry Models',
    caption: 'Frontier and open models behind the agent loop.',
    href: '/concepts/platform/foundry#frontier-models',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'foundry-models',
  },
];

const COMPLEMENTARY_NODES: ArchitectureNode[] = [
  {
    id: 'foundry-iq',
    label: 'Foundry IQ',
    caption: 'Grounded knowledge, connectors, and retrieval.',
    href: '/concepts/platform/foundry#knowledge',
    icon: BookOpen,
    weight: 'complementary',
  },
  {
    id: 'work-iq',
    label: 'Work IQ',
    caption: 'Business workflows and Microsoft 365 integration.',
    href: '/concepts/platform/azure#integration',
    icon: Plug,
    weight: 'complementary',
  },
  {
    id: 'fabric-iq',
    label: 'Fabric IQ',
    caption: 'Analytics-grade data and OneLake grounding.',
    href: '/concepts/platform/azure#data',
    icon: Database,
    weight: 'complementary',
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    caption: 'APIs, MCP tools, and business actions.',
    href: '/concepts/tools',
    icon: Wrench,
    weight: 'complementary',
  },
  {
    id: 'evals',
    label: 'Evals',
    caption: 'Quality, safety, and cost checks on traces.',
    href: '/concepts/platform/azure#observability',
    icon: BarChart3,
    weight: 'complementary',
  },
  {
    id: 'content-safety',
    label: 'Content Safety',
    caption: 'Prompt shields, safety filters, and policy enforcement.',
    href: '/concepts/platform/foundry#frontier-models',
    icon: ShieldCheck,
    weight: 'complementary',
  },
  {
    id: 'ai-gateway',
    label: 'AI Gateway',
    caption: 'API Management for routing, quotas, caching, and policy.',
    href: '/concepts/platform/azure#ai-gateway',
    icon: Waypoints,
    weight: 'complementary',
  },
  {
    id: 'observability',
    label: 'Observability',
    caption: 'Telemetry and insight across the full loop.',
    href: '/concepts/platform/azure#observability',
    icon: Eye,
    weight: 'complementary',
  },
];

const SKILLS_NODE: ArchitectureNode = {
  id: 'agent-skills',
  label: 'Skills',
  caption: 'Reusable agent capabilities that combine with tools in the loop.',
  href: '/concepts/skills',
  icon: Sparkles,
  weight: 'complementary',
};

const FOUNDATION_NODES: ArchitectureNode[] = [
  {
    id: 'entra-rbac',
    label: 'Entra / RBAC',
    caption: 'Identity, scopes, and managed access.',
    href: '/concepts/platform/azure#identity',
    icon: ShieldCheck,
    weight: 'foundation',
  },
  {
    id: 'key-vault',
    label: 'Key Vault',
    caption: 'Secrets and certificates under policy.',
    href: '/concepts/platform/azure#identity',
    icon: KeyRound,
    weight: 'foundation',
  },
  {
    id: 'app-insights',
    label: 'App Insights',
    caption: 'Application traces and live diagnostics.',
    href: '/concepts/platform/azure#observability',
    icon: Eye,
    weight: 'foundation',
  },
  {
    id: 'ai-search',
    label: 'AI Search',
    caption: 'Hybrid vector and keyword retrieval.',
    href: '/concepts/platform/foundry#knowledge',
    icon: BookOpen,
    weight: 'foundation',
  },
  {
    id: 'cosmos',
    label: 'Cosmos',
    caption: 'Agent state, memory, and operational data.',
    href: '/concepts/platform/azure#data',
    icon: Database,
    weight: 'foundation',
  },
  {
    id: 'networking',
    label: 'Networking',
    caption: 'Private endpoints, VNets, and hybrid reach.',
    href: '/concepts/platform/azure#private-net',
    icon: Network,
    weight: 'foundation',
  },
];

const BRAND_ICON_SRC: Record<Exclude<BrandIconName, 'copilot-sdk'>, string> = {
  'hosted-agent': '/ai-agents.svg',
  'foundry-models': '/azure-foundry-models.png',
};

function BrandIcon({ type }: { type: BrandIconName }) {
  if (type === 'copilot-sdk') {
    return (
      <svg className="architecture-brand-svg architecture-brand-copilot-sdk" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.922 16.992c-.861 1.495-5.859 5.023-11.922 5.023-6.063 0-11.061-3.528-11.922-5.023A.641.641 0 0 1 0 16.736v-2.869a.841.841 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.195 10.195 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952 1.399-1.136 3.392-2.093 6.122-2.093 2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.832.832 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256ZM12.172 11h-.344a4.323 4.323 0 0 1-.355.508C10.703 12.455 9.555 13 7.965 13c-1.725 0-2.989-.359-3.782-1.259a2.005 2.005 0 0 1-.085-.104L4 11.741v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.323 4.323 0 0 1-.355-.508h-.016.016Zm.641-2.935c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" />
        <path d="M14.5 14.25a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1Zm-5 0a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  return (
    <img
      src={BRAND_ICON_SRC[type]}
      alt=""
      className={`architecture-brand-img architecture-brand-${type}`}
    />
  );
}

function LayerLabel({ children, platform = false }: { children: string; platform?: boolean }) {
  if (!platform) {
    return <div className="architecture-layer-label">{children}</div>;
  }

  return (
    <div className="architecture-layer-label architecture-layer-label-brand">
      <img src="/ai-foundry.png" alt="" className="architecture-layer-brand-img" />
      <span>{children}</span>
    </div>
  );
}

function ArchitectureNodeLink({ node, dense = false }: { node: ArchitectureNode; dense?: boolean }) {
  const Icon = node.icon;
  return (
    <Link
      to={node.href}
      className={`architecture-node architecture-node-${node.weight} ${dense ? 'is-dense' : ''}`}
      aria-label={`${node.label}: ${node.caption}`}
    >
      <span className={`architecture-node-icon ${node.brandIcon ? `is-brand is-brand-${node.brandIcon}` : ''}`}>
        {node.brandIcon ? <BrandIcon type={node.brandIcon} /> : <Icon size={dense ? 14 : 18} />}
      </span>
      <span className="architecture-node-copy">
        <span className="architecture-node-label">{node.label}</span>
        {!dense && <span className="architecture-node-caption">{node.caption}</span>}
        {!dense && node.id === 'hosted-agent' && (
          <span className="architecture-skill-badge"><Sparkles size={12} /> Skills + tools power the loop</span>
        )}
      </span>
    </Link>
  );
}

function Spine({ variant }: { variant: ArchitectureVariant }) {
  const [githubCopilotSdk, hostedAgent, foundryModels] = SPINE_NODES;

  return (
    <div className={`architecture-spine architecture-spine-${variant}`}>
      <div className="architecture-system-flow">
        <ArchitectureNodeLink node={githubCopilotSdk} />
        <div className="architecture-model-connector" aria-hidden="true">
          <span className="architecture-model-connector-label">runs in</span>
        </div>
        <ArchitectureNodeLink node={hostedAgent} />
        <div className="architecture-model-connector" aria-hidden="true">
          <span className="architecture-model-connector-label">model calls</span>
        </div>
        <ArchitectureNodeLink node={foundryModels} />
      </div>
    </div>
  );
}

function CompactArchitecture() {
  return (
    <section className="architecture-strip architecture-strip-compact" aria-labelledby="architecture-strip-heading">
      <div className="architecture-strip-head">
        <div>
          <div className="section-eyebrow">Reference architecture</div>
          <h2 id="architecture-strip-heading">The core system at a glance.</h2>
          <p>The GitHub Copilot SDK runs inside a Hosted Agent, where skills and tools make model calls useful.</p>
        </div>
        <Link className="explore-btn architecture-strip-cta" to="/concepts/platform">Explore the map</Link>
      </div>

      <Spine variant="compact" />

      <div className="architecture-chip-row" aria-label="Complementary platform services">
        {[SKILLS_NODE, ...COMPLEMENTARY_NODES].map(node => <ArchitectureNodeLink key={node.id} node={node} dense />)}
      </div>
    </section>
  );
}

function FullArchitecture() {
  const serviceColumns = [
    {
      title: 'Intelligence',
      nodes: COMPLEMENTARY_NODES.filter(node => ['foundry-iq', 'work-iq', 'fabric-iq'].includes(node.id)),
    },
    {
      title: 'Skills + Tools',
      nodes: [SKILLS_NODE, ...COMPLEMENTARY_NODES.filter(node => node.id === 'toolbox')],
      note: 'Skills and tools plug into the Agent Loop (GHCP SDK) and execute through the Hosted Agent runtime.',
    },
    {
      title: 'Control Plane',
      nodes: COMPLEMENTARY_NODES.filter(node => ['evals', 'content-safety', 'ai-gateway', 'observability'].includes(node.id)),
    },
  ];

  return (
    <section className="architecture-strip architecture-strip-full" aria-labelledby="platform-architecture-heading">
      <div className="architecture-strip-head">
        <div>
          <div className="section-eyebrow">Interactive map</div>
          <h2 id="platform-architecture-heading">Agentic Backbone, Foundry Platform, Azure Foundation.</h2>
          <p>Use the map to explain the story: GitHub Copilot SDK powers the loop, skills and tools create differentiated value, and Azure Foundry plus Azure foundation services operationalize it for enterprise customers.</p>
        </div>
      </div>

      <div className="architecture-full-canvas">
        <div className="architecture-layer architecture-core-layer" aria-label="Core agent system">
          <div className="architecture-layer-label">Agentic Backbone</div>
          <Spine variant="full" />
        </div>

        <div className="architecture-layer architecture-services-layer" aria-label="Foundry Platform">
          <LayerLabel platform>Foundry Platform</LayerLabel>
          <div className="architecture-service-grid">
            {serviceColumns.map(column => (
              <div key={column.title} className="architecture-service-column">
                <h3>{column.title}</h3>
                <div className="architecture-service-stack">
                  {column.nodes.map(node => <ArchitectureNodeLink key={node.id} node={node} />)}
                  {column.note && <p className="architecture-service-note">{column.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="architecture-foundation" aria-label="Foundation services">
          <div className="architecture-foundation-label">Azure Foundation</div>
          <div className="architecture-foundation-grid">
            {FOUNDATION_NODES.map(node => <ArchitectureNodeLink key={node.id} node={node} dense />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ArchitectureStrip({ variant }: { variant: ArchitectureVariant }) {
  return variant === 'compact' ? <CompactArchitecture /> : <FullArchitecture />;
}
