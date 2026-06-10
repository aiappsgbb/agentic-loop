import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Mic, Plus, Brain, ImageIcon, Volume2, Headphones, MessagesSquare,
  FileSearch, BookOpen, Eye, ShieldCheck, Network, Database, Workflow,
  Building2, GraduationCap, Wrench, Rocket, X, ArrowRight,
  Plug, Waypoints, KeyRound, HardDrive,
} from 'lucide-react';
import CapabilityPicker, { type PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';

const CAPABILITIES: PickerOption[] = [
  { id: 'frontier-models', label: 'Frontier Models', description: 'GPT, Claude, Llama, Phi', icon: Brain, link: '/concepts/platform/foundry#frontier-models' },
  { id: 'image-generation', label: 'Image Generation', description: 'DALL·E, Stable Diffusion', icon: ImageIcon, link: '/concepts/platform/foundry#image-generation' },
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
];;

const THEMES: PickerOption[] = [
  { id: 'workflow', label: 'Workflow Automation', description: 'Multi-step orchestration', icon: Workflow },
  { id: 'domain', label: 'Domain-Specific Agents', description: 'Vertical specialization', icon: Building2 },
  { id: 'knowledge-grounding', label: 'Knowledge Grounding', description: 'Trusted enterprise data', icon: GraduationCap },
];

const BUILD_SKILL_POOL = [
  'spec-synthesizer', 'prompt-architect', 'eval-harness-builder', 'tool-registrar',
  'rag-indexer', 'safety-policy-wizard', 'agent-graph-composer', 'telemetry-wiring',
  'voice-pipeline-builder', 'vision-pipeline-builder', 'iac-bicep-generator', 'ci-cd-bootstrapper',
];
const RUN_SKILL_POOL = [
  'intent-router', 'memory-orchestrator', 'plan-and-act', 'reflection-loop',
  'guardrails-enforcer', 'tool-invoker', 'retrieval-fetcher', 'response-composer',
  'evaluator-judge', 'cost-controller', 'session-handoff', 'human-in-the-loop',
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export default function Hero() {
  const [capabilities, setCapabilities] = useState<string[]>(['frontier-models']);
  const [blocks, setBlocks] = useState<string[]>(['observability']);
  const [themes, setThemes] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [skills, setSkills] = useState<{ build: string[]; run: string[] } | null>(null);
  const timer = useRef<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const labelMap = useMemo(() => {
    const m = new Map<string, string>();
    [...CAPABILITIES, ...BUILDING_BLOCKS, ...THEMES].forEach(o => m.set(o.id, o.label));
    return m;
  }, []);

  useEffect(() => {
    if (!text.trim()) { setProcessing(false); setSkills(null); return; }
    setProcessing(true);
    setSkills(null);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSkills({
        build: pick(BUILD_SKILL_POOL, 4),
        run: pick(RUN_SKILL_POOL, 5),
      });
      setProcessing(false);
    }, 2200);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [text]);

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
      `It should orchestrate multiple specialized agents that collaborate through a shared planner, ` +
      `retrieve grounded knowledge on demand, and continuously self-evaluate against business KPIs. ` +
      `Provide an opinionated repo scaffolded by GitHub Copilot and deploy-ready Bicep for Microsoft Foundry.`
    );
  }

  return (
    <section className="hero">
      <h1>
        Ship your ideas with the <span className="gradient-text">Agentic Loop</span>
        <span className="sparkle" aria-hidden />
      </h1>
      <p className="lede">
        Build, Run and Scale AI apps &amp; agents with GitHub Copilot + Microsoft Foundry<br />
        <ArrowRight size={16} className="lede-arrow" aria-hidden /> in one continuous loop.
      </p>

      <div className="picker-bar">
        <CapabilityPicker label="Capabilities" options={CAPABILITIES} selected={capabilities} onChange={setCapabilities} triggerIcon={Brain} />
        <CapabilityPicker label="Building blocks" options={BUILDING_BLOCKS} selected={blocks} onChange={setBlocks} triggerIcon={ShieldCheck} />
        <CapabilityPicker label="Themes" options={THEMES} selected={themes} onChange={setThemes} triggerIcon={Workflow} />
        <button className="craft-btn" onClick={craftPrompt}>
          <Sparkles size={15} /> Craft the prompt
        </button>
      </div>

      <div className="prompt-shell" id="prompt">
        <div className="prompt-lane-tag"><Sparkles size={13} /> Build from scratch · the greenfield lane</div>
        <div className="prompt-box">
          <textarea
            placeholder="Describe your AI agentic app and let copilot cook it for you"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="prompt-actions">
            <button className="icon-btn" aria-label="Voice"><Mic size={16} /></button>
            <button className="icon-btn" aria-label="Attach"><Plus size={16} /></button>
            <button
              className="craft-btn primary"
              onClick={() => setModalOpen(true)}
              disabled={!skills}
              title={skills ? 'Open the guided setup' : 'Describe your agent first'}
            >
              <Rocket size={15} /> Make it real
            </button>
          </div>
        </div>
      </div>

      {processing && (
        <div className="processing">
          <div className="dots"><span className="dot" /><span className="dot" /><span className="dot" /></div>
          <span className="label">Analyzing intent · matching agents · selecting skills…</span>
          <div className="progress" />
        </div>
      )}

      {skills && !processing && (
        <div className="skills-result">
          <div className="skills-card">
            <h3><Wrench size={14} /> Skills to build</h3>
            <p className="sub">Copilot will scaffold and wire these into your repo. Remove anything you don't want.</p>
            {skills.build.length === 0 && <p className="empty-skills">No build skills selected.</p>}
            {skills.build.map(s => (
              <span key={s} className="skill-pill">
                <Sparkles size={12} /> {s}
                <button
                  className="skill-pill-remove"
                  onClick={() => setSkills(prev => prev ? { ...prev, build: prev.build.filter(x => x !== s) } : prev)}
                  aria-label={`Remove ${s}`}
                  title="Remove skill"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="skills-card">
            <h3><Workflow size={14} /> Skills to run</h3>
            <p className="sub">Foundry will host and orchestrate these at runtime. Remove anything you don't want.</p>
            {skills.run.length === 0 && <p className="empty-skills">No run skills selected.</p>}
            {skills.run.map(s => (
              <span key={s} className="skill-pill run">
                <Brain size={12} /> {s}
                <button
                  className="skill-pill-remove"
                  onClick={() => setSkills(prev => prev ? { ...prev, run: prev.run.filter(x => x !== s) } : prev)}
                  aria-label={`Remove ${s}`}
                  title="Remove skill"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <MakeItRealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prompt={text}
        buildSkills={skills?.build ?? []}
        runSkills={skills?.run ?? []}
      />
    </section>
  );
}
