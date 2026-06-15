import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Sparkles, Mic, Plus, Brain, ImageIcon, Volume2, Headphones, MessagesSquare,
  FileSearch, BookOpen, Eye, ShieldCheck, Network, Database, Workflow,
  Building2, GraduationCap, Wrench, Rocket,
  Plug, Waypoints, KeyRound, HardDrive, Cloud,
} from 'lucide-react';
import CapabilityPicker, { type PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';
import {
  buildAdvisorPackage,
  inferRequirementsFromSelections,
} from '../data/advisor';

const CAPABILITIES: PickerOption[] = [
  { id: 'frontier-models', label: 'Frontier Models', description: 'GPT, Claude, Llama, Phi', icon: Brain, link: '/concepts/platform/foundry#frontier-models' },
  { id: 'image-generation', label: 'Image Generation', description: 'DALL-E, Stable Diffusion', icon: ImageIcon, link: '/concepts/platform/foundry#image-generation' },
  { id: 'text-to-speech', label: 'Text to Speech', description: 'Neural voices', icon: Volume2, link: '/concepts/platform/foundry#text-to-speech' },
  { id: 'speech-to-text', label: 'Speech to Text', description: 'Real-time transcription', icon: Headphones, link: '/concepts/platform/foundry#speech-to-text' },
  { id: 'realtime', label: 'Real-Time Conversations', description: 'Voice-first agents', icon: MessagesSquare, link: '/concepts/platform/foundry#realtime' },
  { id: 'forms', label: 'Forms Recognition', description: 'Document intelligence', icon: FileSearch, link: '/concepts/platform/foundry#forms' },
  { id: 'knowledge', label: 'Knowledge', description: 'Vector grounding & RAG', icon: BookOpen, link: '/concepts/platform/foundry#knowledge' },
];

const BUILDING_BLOCKS: PickerOption[] = [
  { id: 'observability', label: 'Observability', description: 'Traces, evals, monitoring', icon: Eye, link: '/concepts/platform/azure#observability' },
  { id: 'integration', label: 'Integration', description: 'Connect systems', icon: Plug, link: '/concepts/platform/azure#integration' },
  { id: 'ai-gateway', label: 'AI Gateway', description: 'Routing, quotas, policies', icon: Waypoints, link: '/concepts/platform/azure#ai-gateway' },
  { id: 'identity', label: 'Identity & Access', description: 'Entra, RBAC, scopes', icon: KeyRound, link: '/concepts/platform/azure#identity' },
  { id: 'private-net', label: 'Private Networking', description: 'VNet, Private Endpoints', icon: Network, link: '/concepts/platform/azure#private-net' },
  { id: 'data', label: 'Data Persistence', description: 'Cosmos DB, Postgres', icon: Database, link: '/concepts/platform/azure#data' },
  { id: 'storage', label: 'Storage', description: 'Blobs, files, vectors', icon: HardDrive, link: '/concepts/platform/azure#storage' },
];

const THEMES: PickerOption[] = [
  { id: 'workflow', label: 'Workflow Automation', description: 'Multi-step orchestration', icon: Workflow },
  { id: 'domain', label: 'Domain-Specific Agents', description: 'Vertical specialization', icon: Building2 },
  { id: 'knowledge-grounding', label: 'Knowledge Grounding', description: 'Trusted enterprise data', icon: GraduationCap },
];

export default function GreenfieldBuilder() {
  const [capabilities, setCapabilities] = useState<string[]>(['frontier-models']);
  const [blocks, setBlocks] = useState<string[]>(['observability', 'identity']);
  const [themes, setThemes] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    [...CAPABILITIES, ...BUILDING_BLOCKS, ...THEMES].forEach(o => m.set(o.id, o.label));
    return m;
  }, []);

  const selectedIds = useMemo(() => [...capabilities, ...blocks, ...themes], [blocks, capabilities, themes]);
  const requirementIds = useMemo(
    () => inferRequirementsFromSelections(selectedIds, text),
    [selectedIds, text],
  );

  const advisorPackage = useMemo(() => {
    if (!text.trim()) return null;
    return buildAdvisorPackage({
      path: 'idea',
      intent: text,
      requirementIds,
    });
  }, [requirementIds, text]);

  function craftPrompt() {
    const caps = capabilities.map(c => labelMap.get(c)).filter(Boolean);
    const bls = blocks.map(c => labelMap.get(c)).filter(Boolean);
    const ths = themes.map(c => labelMap.get(c)).filter(Boolean);
    const themePart = ths.length ? ` focused on ${ths.join(', ').toLowerCase()}` : '';
    const capPart = caps.length ? ` leveraging ${caps.join(', ')}` : '';
    const blockPart = bls.length ? ` with first-class ${bls.join(', ')}` : '';
    setText(
      `Design a production-grade agentic application${themePart}.` +
      `${capPart}.${blockPart}. ` +
      `It should use SKILLs and tools to complete domain-specific work, run on Microsoft Foundry, ` +
      `and be deployable with azd up.`,
    );
  }

  return (
    <section className="greenfield" id="prompt">
      <div className="greenfield-head">
        <div className="section-eyebrow">Path 2 · Production Launchpad</div>
        <h2>Have a concrete idea? Turn it into a Copilot-led deployment.</h2>
        <p>
          Choose the capabilities, building blocks, and theme from dropdowns, then get a deterministic package:
          Build SKILLs, Deployment SKILLs, playbooks, tools, architecture recommendations, and an <code>azd up</code> hand-off.
        </p>
      </div>

      <div className="picker-bar">
        <CapabilityPicker label="Capabilities" options={CAPABILITIES} selected={capabilities} onChange={setCapabilities} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={BUILDING_BLOCKS} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
        <CapabilityPicker label="Themes" options={THEMES} selected={themes} onChange={setThemes} triggerIcon={Workflow} />
        <button className="craft-btn" onClick={craftPrompt}>
          <Sparkles size={15} /> Craft the prompt
        </button>
      </div>

      <div className="prompt-shell">
        <div className="prompt-box">
          <textarea
            placeholder="Describe your AI agentic app and let Copilot cook it for you"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="prompt-actions">
            <button className="icon-btn" aria-label="Voice"><Mic size={16} /></button>
            <button className="icon-btn" aria-label="Attach"><Plus size={16} /></button>
            <button
              className="craft-btn primary"
              onClick={() => setModalOpen(true)}
              disabled={!advisorPackage}
              title={advisorPackage ? 'Open the generated package' : 'Describe your agent first'}
            >
              <Rocket size={15} /> Make it real
            </button>
          </div>
        </div>
      </div>

      {advisorPackage && (
        <>
          <div className="skills-result advisor-result">
            <SkillCard title="Build SKILLs" icon={<Wrench size={14} />} sub="Existing upstream skills Copilot should use to create solution code." skills={advisorPackage.buildSkills} />
            <SkillCard title="Deployment SKILLs" icon={<Cloud size={14} />} sub="Existing upstream skills that make the package deployable with azd up." skills={advisorPackage.deploymentSkills} variant="run" />
          </div>

          <div className="advisor-package-preview">
            <div>
              <h3>Selected playbooks</h3>
              <p>Reusable HOW guidance composed into the Copilot prompt.</p>
              <div className="advisor-chip-list">
                {advisorPackage.playbooks.map(p => <span key={p.slug} className="scenario-bridge-pill">{p.name}</span>)}
              </div>
            </div>
            <div>
              <h3>Run architecture</h3>
              <p>Foundry/Azure recommendations derived from the selected requirements.</p>
              <div className="advisor-chip-list">
                {advisorPackage.runArchitecture.map(item => <span key={item} className="scenario-bridge-pill">{item}</span>)}
              </div>
            </div>
          </div>
        </>
      )}

      <MakeItRealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        advisorPackage={advisorPackage}
      />
    </section>
  );
}

function SkillCard({ title, icon, sub, skills, variant }: { title: string; icon: ReactNode; sub: string; skills: string[]; variant?: 'run' }) {
  return (
    <div className="skills-card">
      <h3>{icon} {title}</h3>
      <p className="sub">{sub}</p>
      {skills.map(s => (
        <span key={s} className={`skill-pill ${variant ?? ''}`}>
          <Sparkles size={12} /> {s}
        </span>
      ))}
    </div>
  );
}
