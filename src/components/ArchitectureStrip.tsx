import { Link } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { asset } from '../data/asset';
import {
  SPINE_NODES, COMPLEMENTARY_NODES, SKILLS_NODE, FOUNDATION_NODES,
  selectedArchitecture,
  FOUNDRY_MODELS, isFoundryModelId,
  type ArchitectureNode, type ArchitectureSelections, type ArchitectureSelectionField, type BrandIconName, type FoundryModelId,
} from '../data/architecture';

type ArchitectureVariant = 'compact' | 'full' | 'backbone';

interface ArchitectureSelection {
  values: ArchitectureSelections;
  model: FoundryModelId;
  onModelChange: (model: FoundryModelId) => void;
  onToggle: (field: ArchitectureSelectionField, id: string) => void;
  requiredBy?: (field: ArchitectureSelectionField, id: string) => string | undefined;
}

const BRAND_ICON_SRC: Record<Exclude<BrandIconName, 'copilot-sdk'>, string> = {
  'hosted-agent': asset('/ai-agents.svg'),
  'foundry-models': asset('/azure-foundry-models.png'),
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
      <img src={asset('/ai-foundry.png')} alt="" className="architecture-layer-brand-img" />
      <span>{children}</span>
    </div>
  );
}

function ArchitectureNodeInfo({ node, label, requirement }: { node: ArchitectureNode; label: string; requirement?: string }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (container.current?.contains(document.activeElement)) button.current?.focus();
      setOpen(false);
      event.stopPropagation();
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [open]);

  return (
    <div ref={container} className="architecture-choice-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!container.current?.contains(document.activeElement)) setOpen(false); }}
      onFocus={() => setOpen(true)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={button} type="button" className="architecture-choice-info"
        aria-label={`About ${label}`} aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(true)}>
        <Info size={15} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="architecture-choice-popover" role="region" aria-label={`About ${label}`}>
          <strong>{label}</strong>
          <p>{node.selection?.caption ?? node.caption}</p>
          {requirement && <p>{requirement}. Remove the playbook to change this selection.</p>}
          {node.id === 'foundry-model' && <p>Auto lets Copilot choose a model during the build. Explicit choices are preferences; model availability is validated in your Foundry project.</p>}
          <Link to={node.href} aria-label={`Learn more about ${label}`}>Learn more</Link>
        </div>
      )}
    </div>
  );
}

function ArchitectureNodeLink({ node, dense = false, selection }: {
  node: ArchitectureNode;
  dense?: boolean;
  selection?: ArchitectureSelection;
}) {
  const modelInputId = useId();
  const Icon = node.icon;
  if (selection) {
    const option = node.selection;
    const core = node.weight === 'spine';
    const requirement = option && selection.requiredBy?.(option.field, option.id);
    const requiredByObservability = node.id === 'app-insights' && selection.values.buildingBlocks.includes('observability');
    const checked = core || requiredByObservability || Boolean(option && selection.values[option.field].includes(option.id));
    const label = option?.label ?? node.label;
    return (
      <div className={`architecture-node architecture-node-${node.weight} architecture-choice ${checked ? 'is-included' : 'is-available'}`}>
        <label className="architecture-choice-control">
          <input type="checkbox" checked={checked} disabled={core || requiredByObservability || Boolean(requirement)} aria-label={label}
            aria-description={requirement}
            onChange={() => { if (option) selection.onToggle(option.field, option.id); }} />
          <span className={`architecture-node-icon ${node.brandIcon ? `is-brand is-brand-${node.brandIcon}` : ''}`}>
            {node.brandIcon ? <BrandIcon type={node.brandIcon} /> : <Icon size={18} />}
          </span>
          <span className="architecture-node-copy">
            <span className="architecture-node-label">{label}</span>
            <span className="architecture-choice-state">{core ? 'Core \u00b7 Required' : requiredByObservability ? 'Required by Tracing' : requirement ? 'Required by playbook' : checked ? 'Included' : 'Not included'}</span>
          </span>
        </label>
        {node.id === 'foundry-model' && (
          <div className="architecture-model-choice">
            <label htmlFor={modelInputId}>Foundry model</label>
            <select id={modelInputId} value={selection.model} onChange={event => {
              const model = event.target.value;
              if (isFoundryModelId(model)) selection.onModelChange(model);
            }}>
              {Object.entries(FOUNDRY_MODELS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
        )}
        <ArchitectureNodeInfo node={node} label={label} requirement={requirement} />
      </div>
    );
  }
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

function Spine({ variant, selection }: { variant: ArchitectureVariant; selection?: ArchitectureSelection }) {
  const [githubCopilotSdk, hostedAgent, foundryModels] = SPINE_NODES;

  return (
    <div className={`architecture-spine architecture-spine-${variant}`}>
      <div className="architecture-system-flow">
        <ArchitectureNodeLink node={githubCopilotSdk} selection={selection} />
        <div className="architecture-model-connector" aria-hidden="true">
          <span className="architecture-model-connector-label">runs in</span>
        </div>
        <ArchitectureNodeLink node={hostedAgent} selection={selection} />
        <div className="architecture-model-connector" aria-hidden="true">
          <span className="architecture-model-connector-label">model calls</span>
        </div>
        <ArchitectureNodeLink node={foundryModels} selection={selection} />
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

function FullArchitecture({ selection }: { selection?: ArchitectureSelection }) {
  const serviceColumns = [
    {
      title: 'Microsoft IQ',
      nodes: COMPLEMENTARY_NODES.filter(node => ['foundry-iq', 'work-iq', 'fabric-iq', 'web-iq'].includes(node.id)),
    },
    {
      title: 'Skills + Tools',
      nodes: [SKILLS_NODE, ...COMPLEMENTARY_NODES.filter(node => node.id === 'toolbox')],
      note: 'Skills supply domain expertise; tools connect the agent to business actions.',
    },
    {
      title: 'Optimize',
      nodes: ['observability', 'evals', 'agent-optimizer', 'agent-insights'].flatMap(id =>
        COMPLEMENTARY_NODES.filter(node => node.id === id)),
    },
  ];

  return (
    <section className={`architecture-strip architecture-strip-full ${selection ? 'architecture-configurator' : ''}`}
      aria-label={selection ? 'Select your architecture' : 'Reference architecture'}>
      <div className="architecture-strip-head">
        <div>
          {!selection && <div className="section-eyebrow">Interactive map</div>}
          <h2>{selection ? 'Select your architecture' : 'Agentic Backbone, Foundry Platform, Azure Foundation.'}</h2>
          <p>{selection
            ? 'The backbone is included. Select optional components together with your customer; hover over or tap an info icon for details and documentation.'
            : 'Use the map to explain the story: GitHub Copilot SDK powers the loop, skills and tools create differentiated value, and Azure Foundry plus Azure foundation services operationalize it for enterprise customers.'}</p>
        </div>
      </div>

      <div className="architecture-full-canvas">
        <div className="architecture-layer architecture-core-layer" aria-label="Core agent system">
          <div className="architecture-layer-label">Agentic Backbone</div>
          <Spine variant="full" selection={selection} />
        </div>

        <div className="architecture-layer architecture-services-layer" aria-label="Foundry Platform">
          <LayerLabel platform>Foundry Platform</LayerLabel>
          <div className="architecture-service-grid">
            {serviceColumns.map(column => (
              <div key={column.title} className="architecture-service-column">
                <h3>{column.title}</h3>
                <div className="architecture-service-stack">
                  {column.nodes.map(node => <ArchitectureNodeLink key={node.id} node={node} selection={selection} />)}
                  {!selection && column.note && <p className="architecture-service-note">{column.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="architecture-foundation" aria-label="Foundation services">
          <div className="architecture-foundation-label">Azure Foundation</div>
          <div className="architecture-foundation-grid">
            {FOUNDATION_NODES.map(node => <ArchitectureNodeLink key={node.id} node={node} dense selection={selection} />)}
          </div>
          {selection && (
            <div className="architecture-selection-summary">
              <p role="status">{SPINE_NODES.length} core components + {selectedArchitecture(selection.values).length - SPINE_NODES.length} optional components included</p>
              <p>Selections describe the build scope; nothing is deployed here. Included playbooks lock their required components. Foundry IQ and Skills share their linked agent-capability selections. Tracing includes App Insights. Azure Container Apps starts selected but can be removed. The brief and unselected guide recommendations never select components.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BackboneArchitecture() {
  return (
    <section className="architecture-strip architecture-strip-backbone" aria-labelledby="home-backbone-heading">
      <div className="architecture-strip-head">
        <div>
          <div className="section-eyebrow">Agentic Backbone</div>
          <h2 id="home-backbone-heading">The technology spine behind the production loop.</h2>
          <p>
            This is the agentic core: GitHub Copilot SDK provides the Agent Harness and drives the loop
            with Skills and Tools, Foundry Hosted Agents provides the runtime, and Foundry Models provide
            the reasoning layer.
          </p>
        </div>
        <Link className="explore-btn architecture-strip-cta" to="/concepts/platform">Explore the full architecture</Link>
      </div>

      <div className="architecture-layer architecture-core-layer" aria-label="Agentic Backbone">
        <div className="architecture-layer-label">Agentic Backbone</div>
        <Spine variant="full" />
      </div>
    </section>
  );
}

export default function ArchitectureStrip({ variant, selection }: { variant: ArchitectureVariant; selection?: ArchitectureSelection }) {
  if (variant === 'compact') return <CompactArchitecture />;
  if (variant === 'backbone') return <BackboneArchitecture />;
  return <FullArchitecture selection={selection} />;
}
