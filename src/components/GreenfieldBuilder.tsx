import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Mic, Plus, Brain, ImageIcon, Volume2, Headphones, MessagesSquare,
  FileSearch, BookOpen, Eye, ShieldCheck, Network, Database, Workflow,
  Building2, GraduationCap, Wrench, Rocket,
  Plug, Waypoints, KeyRound, HardDrive,
} from 'lucide-react';
import CapabilityPicker, { type PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';
import {
  buildAdvisorPackage,
  inferRequirementsFromSelections,
} from '../data/advisor';
import { playbooks, playbookMatchTags } from '../data/links';
import { getBuildSkill } from '../data/skills';

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

  const selectedLabels = useMemo(
    () => selectedIds.map(id => labelMap.get(id)).filter((x): x is string => Boolean(x)),
    [selectedIds, labelMap],
  );

  const relatedPlaybooks = useMemo(() => {
    const sel = new Set(selectedLabels);
    return playbooks.filter(p => p.patterns.includes('*') || playbookMatchTags(p).some(t => sel.has(t)));
  }, [selectedLabels]);

  const relatedBuildSkills = useMemo(() => {
    const ids = new Set<string>();
    relatedPlaybooks.forEach(p => (p.buildSkills ?? []).forEach(s => { if (getBuildSkill(s)) ids.add(s); }));
    return [...ids];
  }, [relatedPlaybooks]);

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
        <div className="section-eyebrow">Path 2 · Agentic Launchpad</div>
        <h2>Have a concrete idea? Turn it into a Copilot-led deployment.</h2>
        <p>
          Craft your prompt, then click <strong>Make it real</strong> for a guided, step-by-step
          process that takes you from idea to a deployed agentic solution.
        </p>
      </div>

      <div className="picker-bar">
        <CapabilityPicker label="Capabilities" options={CAPABILITIES} selected={capabilities} onChange={setCapabilities} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={BUILDING_BLOCKS} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
        <CapabilityPicker label="Pattern" options={THEMES} selected={themes} onChange={setThemes} triggerIcon={Workflow} />
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
              onClick={() => { if (!text.trim()) craftPrompt(); setModalOpen(true); }}
              title="Open the generated package"
            >
              <Rocket size={15} /> Make it real
            </button>
          </div>
        </div>
      </div>

      {advisorPackage && (
        <div className="advisor-package-preview">
          <SkillCard title="Build SKILLs" icon={<Wrench size={14} />} sub="Existing upstream skills Copilot should use to create solution code." skills={relatedBuildSkills} />
          <div>
            <h3>Related playbooks</h3>
            <p>Reusable HOW guidance matched from your selections.</p>
            <div className="advisor-chip-list">
              {relatedPlaybooks.map(p => (
                <Link key={p.slug} to={`/playbooks/${p.slug}`} className="scenario-bridge-pill scenario-bridge-pill-link">{p.name}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <MakeItRealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        advisorPackage={advisorPackage}
      />
    </section>
  );
}

function SkillCard({ title, icon, sub, skills }: { title: string; icon: ReactNode; sub: string; skills: string[] }) {
  return (
    <div className="skills-card">
      <h3>{icon} {title}</h3>
      <p className="sub">{sub}</p>
      <div className="advisor-chip-list">
        {skills.map(s => (
          <Link key={s} to={`/skills/${s}/SKILL.md`} className="skill-pill skill-pill-link">
            <Sparkles size={12} /> {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
