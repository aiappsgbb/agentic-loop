import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Brain, ImageIcon, Volume2, Headphones, MessagesSquare,
  FileSearch, BookOpen, Eye, ShieldCheck, Network, Database, Workflow,
  Building2, GraduationCap, Wrench, Rocket,
  Plug, KeyRound, HardDrive, Users, UserCheck,
} from 'lucide-react';
import CapabilityPicker, { type PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';
import {
  buildAdvisorPackage,
  inferRequirementsFromSelections,
} from '../data/advisor';
import { playbooks, playbookMatchTags, playbooksForScenario, type Scenario } from '../data/links';
import { getBuildSkill, getRunSkill } from '../data/skills';
import samplePrompts from '../data/sample-prompts.json';

const CAPABILITIES: PickerOption[] = [
  { id: 'frontier-models', label: 'Frontier Models', description: 'GPT, Claude, Llama, Phi', icon: Brain, link: '/concepts/platform/foundry#frontier-models' },
  { id: 'image-generation', label: 'Image Generation', description: 'GPT Image 2, MAI-Image-2.5', icon: ImageIcon, link: '/concepts/platform/foundry#image-generation' },
  { id: 'text-to-speech', label: 'Text to Speech', description: 'Neural voices', icon: Volume2, link: '/concepts/platform/foundry#text-to-speech' },
  { id: 'speech-to-text', label: 'Speech to Text', description: 'Real-time transcription', icon: Headphones, link: '/concepts/platform/foundry#speech-to-text' },
  { id: 'realtime', label: 'Real-Time Conversations', description: 'Voice-first agents', icon: MessagesSquare, link: '/concepts/platform/foundry#realtime' },
  { id: 'forms', label: 'Forms Recognition', description: 'Document intelligence', icon: FileSearch, link: '/concepts/platform/foundry#forms' },
  { id: 'knowledge', label: 'Knowledge', description: 'Vector grounding & RAG', icon: BookOpen, link: '/concepts/platform/foundry#knowledge' },
];

const BUILDING_BLOCKS: PickerOption[] = [
  { id: 'observability', label: 'Observability', description: 'Traces, evals, monitoring', icon: Eye, link: '/concepts/platform/azure#observability' },
  { id: 'ai-gateway', label: 'AI Gateway', description: 'Routing, quotas, policies', icon: Plug, link: '/concepts/platform/azure#ai-gateway' },
  { id: 'identity', label: 'Identity & Access', description: 'Entra, RBAC, scopes', icon: KeyRound, link: '/concepts/platform/azure#identity' },
  { id: 'private-net', label: 'Private Networking', description: 'VNet, Private Endpoints', icon: Network, link: '/concepts/platform/azure#private-net' },
  { id: 'data', label: 'Data Persistence', description: 'Cosmos DB, Postgres', icon: Database, link: '/concepts/platform/azure#data' },
  { id: 'storage', label: 'Storage', description: 'Blobs, files, vectors', icon: HardDrive, link: '/concepts/platform/azure#storage' },
];

const THEMES: PickerOption[] = [
  { id: 'workflow', label: 'Workflow Automation', description: 'Multi-step orchestration', icon: Workflow },
  { id: 'domain', label: 'Domain-Specific Agents', description: 'Vertical specialization', icon: Building2 },
  { id: 'knowledge-grounding', label: 'Knowledge Grounding', description: 'Trusted enterprise data', icon: GraduationCap },
  { id: 'multi-agent', label: 'Multi-Agent Orchestration', description: 'Coordinated agent teams', icon: Users },
  { id: 'human-in-the-loop', label: 'Human-in-the-Loop', description: 'Review & approval gates', icon: UserCheck },
];

const CAP_BY_LABEL = new Map(CAPABILITIES.map(o => [o.label.toLowerCase(), o.id]));
const BLOCK_BY_LABEL = new Map(BUILDING_BLOCKS.map(o => [o.label.toLowerCase(), o.id]));
const THEME_BY_LABEL = new Map(THEMES.map(o => [o.label.toLowerCase(), o.id]));

function initialSelections(scenario?: Scenario) {
  if (!scenario) {
    return { caps: ['frontier-models'], blocks: ['observability'], themes: [] as string[] };
  }
  const toIds = (labels: string[] | undefined, map: Map<string, string>) =>
    (labels ?? []).map(l => map.get(l.toLowerCase())).filter((x): x is string => Boolean(x));
  let caps = toIds(scenario.capabilities, CAP_BY_LABEL);
  let blocks = toIds(scenario.buildingBlocks, BLOCK_BY_LABEL);
  let themes = toIds(scenario.patterns, THEME_BY_LABEL);
  // Fall back to tag-derived selections if structured fields are absent.
  if (!scenario.capabilities && !scenario.buildingBlocks && !scenario.patterns) {
    const c: string[] = []; const b: string[] = []; const t: string[] = [];
    scenario.tags.forEach(tag => {
      const k = tag.toLowerCase();
      if (CAP_BY_LABEL.has(k)) c.push(CAP_BY_LABEL.get(k)!);
      else if (BLOCK_BY_LABEL.has(k)) b.push(BLOCK_BY_LABEL.get(k)!);
      else if (THEME_BY_LABEL.has(k)) t.push(THEME_BY_LABEL.get(k)!);
    });
    caps = c; blocks = b; themes = t;
  }
  if (!caps.length) caps.push('frontier-models');
  if (!blocks.length) blocks.push('observability');
  return { caps, blocks, themes };
}

interface GreenfieldBuilderProps {
  scenario?: Scenario;
  eyebrow?: string;
  heading?: string;
  intro?: ReactNode;
}

export default function GreenfieldBuilder({ scenario, eyebrow, heading, intro }: GreenfieldBuilderProps = {}) {
  const init = useMemo(() => initialSelections(scenario), [scenario]);
  const [capabilities, setCapabilities] = useState<string[]>(init.caps);
  const [blocks, setBlocks] = useState<string[]>(init.blocks);
  const [themes, setThemes] = useState<string[]>(init.themes);
  const [text, setText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    [...CAPABILITIES, ...BUILDING_BLOCKS, ...THEMES].forEach(o => m.set(o.id, o.label));
    return m;
  }, []);

  const selectedIds = useMemo(() => [...capabilities, ...blocks, ...themes], [blocks, capabilities, themes]);
  const requirementIds = useMemo(
    () => inferRequirementsFromSelections(
      scenario ? [...selectedIds, ...scenario.tags] : selectedIds,
      scenario ? `${text} ${scenario.description}` : text,
    ),
    [selectedIds, text, scenario],
  );

  const advisorPackage = useMemo(() => {
    if (!text.trim()) return null;
    return buildAdvisorPackage({
      path: scenario ? 'scenario' : 'idea',
      intent: text,
      scenario,
      requirementIds,
    });
  }, [requirementIds, text, scenario]);

  const selectedLabels = useMemo(
    () => selectedIds.map(id => labelMap.get(id)).filter((x): x is string => Boolean(x)),
    [selectedIds, labelMap],
  );

  const relatedPlaybooks = useMemo(() => {
    const sel = new Set(selectedLabels);
    const byTags = playbooks.filter(p => p.patterns.includes('*') || playbookMatchTags(p).some(t => sel.has(t)));
    if (!scenario) return byTags;
    const map = new Map<string, typeof byTags[number]>();
    [...playbooksForScenario(scenario), ...byTags].forEach(p => map.set(p.slug, p));
    return [...map.values()];
  }, [selectedLabels, scenario]);

  const relatedBuildSkills = useMemo(() => {
    const ids = new Set<string>();
    relatedPlaybooks.forEach(p => (p.buildSkills ?? []).forEach(s => { if (getBuildSkill(s)) ids.add(s); }));
    return [...ids];
  }, [relatedPlaybooks]);

  const relatedRunSkills = useMemo(() => {
    const ids = new Set<string>();
    relatedPlaybooks.forEach(p => (p.runSkills ?? []).forEach(s => { if (getRunSkill(s)) ids.add(s); }));
    return [...ids];
  }, [relatedPlaybooks]);

  function craftPrompt() {
    const caps = capabilities.map(c => labelMap.get(c)).filter(Boolean);
    const bls = blocks.map(c => labelMap.get(c)).filter(Boolean);
    const ths = themes.map(c => labelMap.get(c)).filter(Boolean);
    const existing = text.trim();
    let ideaSentence: string;
    if (existing) {
      ideaSentence = existing.split(/\s*(?:Capabilities|Building blocks|Patterns):/)[0].trim().replace(/\.?$/, '.');
    } else if (scenario?.prompt) {
      ideaSentence = scenario.prompt.trim().replace(/\.?$/, '.');
    } else {
      ideaSentence = `${samplePrompts[Math.floor(Math.random() * samplePrompts.length)]}.`;
    }
    const parts = [ideaSentence];
    if (caps.length) parts.push(`Capabilities: ${caps.join(', ')}.`);
    if (bls.length) parts.push(`Building blocks: ${bls.join(', ')}.`);
    if (ths.length) parts.push(`Patterns: ${ths.join(', ')}.`);
    setText(parts.join(' '));
  }

  // When mounted for a scenario, auto-press "Craft the prompt".
  useEffect(() => {
    if (scenario) craftPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  return (
    <section className="greenfield" id="prompt">
      <div className="greenfield-head">
        <div className="section-eyebrow">{eyebrow ?? 'Path 2 · Agentic Launchpad'}</div>
        <h2>{heading ?? 'Have a concrete idea? Turn it into a Copilot-led deployment.'}</h2>
        <p>
          {intro ?? (
            <>
              Craft your prompt, then click <strong>Make it real</strong> for a guided, step-by-step
              process that takes you from idea to a deployed agentic solution.
            </>
          )}
        </p>
      </div>

      <div className="picker-bar">
        <CapabilityPicker label="Capabilities" options={CAPABILITIES} selected={capabilities} onChange={setCapabilities} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={BUILDING_BLOCKS} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
        <CapabilityPicker label="Patterns" options={THEMES} selected={themes} onChange={setThemes} triggerIcon={Workflow} />
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
            <button
              className="craft-btn primary"
              onClick={() => { if (!text.trim()) craftPrompt(); setModalOpen(true); }}
              disabled={!text.trim()}
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
          <div className="skills-card">
            <h3><Rocket size={14} /> Run SKILLs</h3>
            <p className="sub">Reusable run-phase skills the agent invokes at execution time.</p>
            {relatedRunSkills.length > 0 ? (
              <div className="advisor-chip-list">
                {relatedRunSkills.map(s => (
                  <Link key={s} to={`/skills/${s}`} className="skill-pill run skill-pill-link">
                    <Rocket size={12} /> {s}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="advisor-run-empty">Run SKILLs are generated during the build phase.</p>
            )}
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
          <Link key={s} to={`/skills/${s}`} className="skill-pill skill-pill-link">
            <Sparkles size={12} /> {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
