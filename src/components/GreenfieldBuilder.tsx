import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { playbooks, ROLE_LABELS, type Scenario } from '../data/catalog';
import workshopBriefs from '../data/workshop-briefs.json';
import {
  recommendWorkshop, formatWorkshopSpec, approvalIsCurrent, canApproveSpec,
  type WorkshopSpec,
} from '../data/workshop';
import { WorkshopContext, newWorkshopDraft, type WorkshopDraft } from './WorkshopContext';
import { localAIEnabled, requestWorkshopAnalysis } from '../lib/workshopAI';

const CAPABILITIES: PickerOption[] = [
  { id: 'frontier-models', label: 'Frontier Models', description: 'GPT, Claude, Llama, Phi', icon: Brain, link: '/concepts/platform/foundry#frontier-models' },
  { id: 'image-generation', label: 'Image Generation', description: 'GPT Image 2, MAI-Image-2.5', icon: ImageIcon, link: '/concepts/platform/foundry#image-generation' },
  { id: 'text-to-speech', label: 'Text to Speech', description: 'Neural voices', icon: Volume2, link: '/concepts/platform/foundry#text-to-speech' },
  { id: 'speech-to-text', label: 'Speech to Text', description: 'Real-time transcription', icon: Headphones, link: '/concepts/platform/foundry#speech-to-text' },
  { id: 'realtime', label: 'Real-Time Conversations', description: 'Voice-first agents', icon: MessagesSquare, link: '/concepts/platform/foundry#realtime' },
  { id: 'forms', label: 'Forms Recognition', description: 'Document intelligence', icon: FileSearch, link: '/concepts/platform/foundry#forms' },
  { id: 'knowledge', label: 'Foundry IQ', description: 'Grounded knowledge & retrieval', icon: BookOpen, link: '/concepts/platform/foundry#foundry-iq' },
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

const labelMap = new Map([...CAPABILITIES, ...BUILDING_BLOCKS, ...THEMES].map(o => [o.id, o.label]));
const lines = (value: string) => value.split('\n').map(line => line.trim()).filter(Boolean);
const COVERAGE_LABELS = {
  strong: 'Strong documented match',
  partial: 'Partial coverage',
  none: 'No suitable packaged playbook',
  clarification: 'Needs clarification',
  unsupported: 'Unsupported requirement',
};

interface GreenfieldBuilderProps {
  scenario?: Scenario;
  eyebrow?: string;
  heading?: string;
  intro?: ReactNode;
  guideSlug?: string;
}

export default function GreenfieldBuilder({ scenario, eyebrow, heading, intro, guideSlug }: GreenfieldBuilderProps = {}) {
  const { drafts, update } = useContext(WorkshopContext);
  const key = scenario?.id ?? (guideSlug ? `guide-${guideSlug}` : 'customer');
  const seed = useMemo(() => {
    const draft = newWorkshopDraft(scenario?.prompt ?? scenario?.description ?? '');
    if (guideSlug && playbooks.some(p => p.slug === guideSlug && p.role !== 'onboarding')) {
      draft.manualGuideIds = [guideSlug];
      if (guideSlug === 'threadlight-pipeline') draft.execution = 'threadlight-pipeline';
    }
    return draft;
  }, [scenario, guideSlug]);
  const draft = drafts[key] ?? seed;
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const latestDraft = useRef(draft);
  useEffect(() => { latestDraft.current = draft; }, [draft]);
  useEffect(() => () => requestRef.current?.abort(), []);

  function patch(values: Partial<WorkshopDraft>, upstream = false) {
    if (requestRef.current) {
      requestRef.current.abort();
      requestRef.current = null;
      setBusy(false);
    }
    const next = { ...draft, ...values, approved: null };
    if (upstream) {
      next.prepared = false;
      next.proposal = null;
      next.acceptedIds = [];
      next.resolutions = '';
      if ('brief' in values) { next.outcome = ''; next.inScope = ''; }
    }
    latestDraft.current = next;
    update(key, next);
    setError('');
  }

  const acceptedSuggestions = draft.proposal?.suggestions.filter(s => draft.acceptedIds.includes(`${s.kind}:${s.id}`)) ?? [];
  const selectionIds = (kind: 'capabilities' | 'buildingBlocks' | 'patterns') => [
    ...new Set([...draft[kind], ...acceptedSuggestions.filter(s => s.kind === kind && s.source === 'catalog').map(s => s.id)]),
  ];
  const capabilities = selectionIds('capabilities');
  const buildingBlocks = selectionIds('buildingBlocks');
  const patterns = selectionIds('patterns');
  const selectedIds = [...capabilities, ...buildingBlocks, ...patterns];
  const coverage = recommendWorkshop(draft.brief, selectedIds,
    [...lines(draft.customCapabilities), ...lines(draft.customBlocks), ...lines(draft.customPatterns)]);
  const chosenGuides = playbooks.filter(p => p.role !== 'onboarding' &&
    ((!draft.removedGuideIds.includes(p.slug) &&
      (draft.manualGuideIds.includes(p.slug) || coverage.guides.some(g => g.playbook.slug === p.slug))) ||
      draft.execution === 'threadlight-pipeline' && p.slug === 'threadlight-pipeline'));
  const spec: WorkshopSpec = {
    brief: draft.brief, outcome: draft.outcome, users: draft.users,
    inScope: lines(draft.inScope), outOfScope: lines(draft.outOfScope),
    constraints: lines(draft.constraints), assumptions: lines(draft.assumptions),
    successCriteria: lines(draft.criteria), evidence: lines(draft.evidence),
    capabilities: [...capabilities.map(id => labelMap.get(id) ?? id), ...lines(draft.customCapabilities), ...acceptedSuggestions.filter(s => s.kind === 'capabilities' && s.source === 'custom').map(s => s.label)],
    buildingBlocks: [...buildingBlocks.map(id => labelMap.get(id) ?? id), ...lines(draft.customBlocks), ...acceptedSuggestions.filter(s => s.kind === 'buildingBlocks' && s.source === 'custom').map(s => s.label)],
    candidatePatterns: [...patterns.map(id => labelMap.get(id) ?? id), ...lines(draft.customPatterns), ...acceptedSuggestions.filter(s => s.kind === 'patterns' && s.source === 'custom').map(s => s.label)],
    execution: draft.execution,
    guides: chosenGuides.map(p => ({
      slug: p.slug,
      reason: coverage.guides.find(g => g.playbook.slug === p.slug)?.reasons.join('; ') ?? 'Explicit expert selection; suitability must be validated.',
    })),
    acceptedSuggestions,
    gaps: coverage.requirements.filter(r => !chosenGuides.some(p => p.addresses.includes(r.id))).map(r => r.label),
    openQuestions: [...coverage.questions, ...coverage.unsupported, ...lines(draft.questions),
      ...(draft.execution === 'threadlight-pipeline' ? ['Validate the shipped Threadlight prerequisites, opinionated scope and customer deployment boundaries.'] : []),
      ...(draft.proposal?.questions ?? []), ...(draft.proposal?.uncertainties ?? []), ...(draft.proposal?.unsupported ?? [])],
    resolutions: draft.resolutions,
  };
  const approved = approvalIsCurrent(spec, draft.approved);
  const advisorPackage = draft.prepared ? buildAdvisorPackage({
    path: scenario ? 'scenario' : 'idea',
    intent: draft.brief, scenario,
    requirementIds: inferRequirementsFromSelections(selectedIds, draft.brief),
    workshopSpec: spec,
  }) : null;

  function prepare() {
    if (!draft.brief.trim()) return;
    patch({
      prepared: true, outcome: draft.outcome || draft.brief,
      inScope: draft.inScope || coverage.requirements.map(r => r.label).join('\n') || draft.brief,
    });
  }
  async function analyzeGaps() {
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setBusy(true); setError('');
    const request = {
      brief: draft.brief, gaps: coverage.gaps,
      coveredRequirementIds: coverage.requirements.filter(r => !coverage.gaps.includes(r)).map(r => r.id),
    };
    try {
      const proposal = await requestWorkshopAnalysis(request, controller.signal);
      if (requestRef.current !== controller || controller.signal.aborted) return;
      const next = { ...latestDraft.current, proposal, acceptedIds: [], approved: null };
      update(key, next);
    } catch (failure) {
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setError(failure instanceof Error ? failure.message : 'SDK analysis failed. Nothing was applied.');
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setBusy(false); }
    }
  }
  function changeSelection(field: 'capabilities' | 'buildingBlocks' | 'patterns', ids: string[]) {
    patch({
      [field]: ids,
      acceptedIds: draft.acceptedIds.filter(key => !key.startsWith(`${field}:`) || ids.includes(key.slice(field.length + 1))),
    }, true);
  }
  function toggleSuggestion(index: number) {
    const suggestion = draft.proposal!.suggestions[index];
    const id = `${suggestion.kind}:${suggestion.id}`;
    const isAccepted = draft.acceptedIds.includes(id);
    patch({
      acceptedIds: isAccepted ? draft.acceptedIds.filter(s => s !== id) : [...draft.acceptedIds, id],
    });
  }

  return (
    <section className="greenfield" id="prompt">
      <div className="greenfield-head">
        <div className="section-eyebrow">{eyebrow ?? 'Customer workshop · Agentic Launchpad'}</div>
        <h2>{heading ?? 'Start a technical workshop'}</h2>
        <p>
          {intro ?? 'Turn customer requirements into a tailored MVP or pilot. Reuse maintained guidance first; generate only what is missing. A workshop is not a production-readiness certification.'}
        </p>
      </div>
      <div className="prompt-shell">
        <div className="prompt-box">
          <label htmlFor={`brief-${key}`}>What should the customer be able to do?</label>
          <p id={`brief-help-${key}`} className="prompt-help">
            {key === 'customer' && workshopBriefs.includes(draft.brief)
              ? 'Sample customer brief. Edit or replace it with your own.'
              : 'Describe their goal, who will use it, and any constraints.'}
          </p>
          <textarea
            id={`brief-${key}`} aria-describedby={`brief-help-${key}`} maxLength={3000}
            placeholder="Enter the customer brief here..."
            value={draft.brief}
            onChange={e => patch({ brief: e.target.value }, true)}
          />
          <div className="prompt-actions">
            <button className="craft-btn primary" onClick={prepare} disabled={!draft.brief.trim()}>
              <Sparkles size={15} /> Prepare workshop
            </button>
          </div>
        </div>
      </div>
      <details className="workshop-technical">
        <summary>Technical requirements (optional expert editing)</summary>
        <div className="picker-bar">
          <CapabilityPicker label="Capabilities" options={CAPABILITIES} selected={capabilities} onChange={ids => changeSelection('capabilities', ids)} triggerIcon={Brain} />
          <CapabilityPicker label="Building blocks" options={BUILDING_BLOCKS} selected={buildingBlocks} onChange={ids => changeSelection('buildingBlocks', ids)} triggerIcon={ShieldCheck} />
          <CapabilityPicker label="Candidate patterns" options={THEMES} selected={patterns} onChange={ids => changeSelection('patterns', ids)} triggerIcon={Workflow} />
        </div>
        <p className="muted">Selections and candidate patterns are provisional. Identity, safe data handling and verification remain essential even when a selector is removed.</p>
        <div className="workshop-fields">
          {([['customCapabilities', 'Custom capabilities'], ['customBlocks', 'Custom building blocks'], ['customPatterns', 'Custom candidate patterns']] as const).map(([field, label]) => (
            <div key={field} className="workshop-field">
              <label htmlFor={`${key}-${field}`}>{label} (one per line)</label>
              <textarea id={`${key}-${field}`} value={draft[field]} onChange={e => patch({ [field]: e.target.value }, true)} />
            </div>
          ))}
        </div>
      </details>

      {!approved && draft.prepared && <p role="status">Scope/specification is not approved. Any edit requires a fresh review.</p>}
      {draft.prepared && (
        <div className="workshop-plan">
          <section className="skills-card" aria-label="Coverage and reuse">
            <h3>{COVERAGE_LABELS[coverage.state]}</h3>
            <p>{coverage.state === 'strong'
              ? 'Reuse this maintained guidance. No gap-generation call is needed. Validate prerequisites and adapt only customer scope.'
              : 'Catalog coverage is not technical feasibility. Review gaps and constraints before building.'}</p>
            {coverage.questions.map(q => <p key={q} className="workshop-warning">{q}</p>)}
            {coverage.unsupported.map(q => <p key={q} className="workshop-warning">{q}</p>)}
            {coverage.guides.map(g => (
              <div key={g.playbook.slug} className="workshop-guide">
                <label><input type="checkbox" checked={chosenGuides.some(p => p.slug === g.playbook.slug)}
                  disabled={draft.execution === 'threadlight-pipeline' && g.playbook.slug === 'threadlight-pipeline'} onChange={e => patch({
                  removedGuideIds: e.target.checked ? draft.removedGuideIds.filter(id => id !== g.playbook.slug) : [...draft.removedGuideIds, g.playbook.slug],
                })} /> {g.playbook.name}</label>
                <span className="scenario-tag">{ROLE_LABELS[g.playbook.role]}</span>
                <p>{g.reasons.join('; ')}</p>
                <p>{g.playbook.adaptation}</p>
                <p><strong>Prerequisites:</strong> {g.playbook.prerequisites.join('; ')}</p>
                <p><strong>Exclusions:</strong> {g.playbook.exclusions.join('; ')}</p>
                <Link to={`/playbooks/${g.playbook.slug}`}>Read the maintained guide</Link>
              </div>
            ))}
            <details>
              <summary>Expert guide override</summary>
              {playbooks.filter(p => p.role !== 'onboarding' && !coverage.guides.some(g => g.playbook.slug === p.slug)).map(p => (
                <label key={p.slug} className="workshop-check"><input type="checkbox" checked={chosenGuides.some(g => g.slug === p.slug)}
                  disabled={draft.execution === 'threadlight-pipeline' && p.slug === 'threadlight-pipeline'} onChange={e => patch({
                  manualGuideIds: e.target.checked ? [...draft.manualGuideIds, p.slug] : draft.manualGuideIds.filter(id => id !== p.slug),
                })} /> {p.name} ({ROLE_LABELS[p.role]})</label>
              ))}
              <p>Manual relevance is not proven coverage. Review the guide's prerequisites and exclusions.</p>
            </details>
            {coverage.gaps.length > 0 && (
              <div className="workshop-gaps">
                <h4>Uncovered requirements</h4>
                {coverage.gaps.map(g => <p key={g.id}>{g.label}</p>)}
                {!localAIEnabled() && <p role="status">AI analysis is unavailable on this static portal. Use the documented local Copilot SDK companion, or explicitly validate manual scope. No AI proposal has been generated.</p>}
                <button className="craft-btn" onClick={analyzeGaps} disabled={busy || coverage.state === 'clarification' || coverage.state === 'unsupported'}>
                  <Sparkles size={15} /> {busy ? 'Analyzing only gaps...' : 'Propose only gaps with Copilot SDK'}
                </button>
                {busy && <button className="ghost-btn" onClick={() => {
                  requestRef.current?.abort(); requestRef.current = null; setBusy(false); setError('Analysis cancelled. Nothing was applied.');
                }}>Cancel analysis</button>}
              </div>
            )}
            {error && <p role="alert" className="workshop-warning">{error}</p>}
          </section>
          {draft.proposal && (
            <section className="skills-card" aria-label="Provisional AI suggestions">
              <h3>Provisional AI suggestions</h3>
              <p>Accept, edit or remove each suggestion. These are not maintained guidance or validated platform support.</p>
              {draft.proposal.suggestions.map((s, index) => (
                <div className="workshop-guide" key={`${s.kind}:${s.id}`}>
                  <label><input type="checkbox" aria-label={`Accept suggestion ${index + 1}: ${s.label}`} checked={draft.acceptedIds.includes(`${s.kind}:${s.id}`)} onChange={() => toggleSuggestion(index)} /> Accept {s.source} {s.kind}</label>
                  <input aria-label={`Suggestion ${index + 1}`} value={s.label} onChange={e => patch({
                    proposal: { ...draft.proposal!, suggestions: draft.proposal!.suggestions.map((item, i) => i === index ? { ...item, label: e.target.value } : item) },
                  })} />
                  <p>{s.reason}</p>
                </div>
              ))}
              {draft.proposal.guideIds.map(id => <label key={id} className="workshop-check">
                <input type="checkbox" checked={draft.manualGuideIds.includes(id)} onChange={e => patch({
                  manualGuideIds: e.target.checked ? [...draft.manualGuideIds, id] : draft.manualGuideIds.filter(value => value !== id),
                  removedGuideIds: draft.removedGuideIds.filter(value => value !== id),
                })} /> Review proposed guide: {playbooks.find(p => p.slug === id)?.name}
              </label>)}
              {[...draft.proposal.questions, ...draft.proposal.uncertainties, ...draft.proposal.unsupported].map((q, i) => <p key={i} className="workshop-warning">{q}</p>)}
            </section>
          )}
          <section className="skills-card">
            <h3>Review customer scope and specification</h3>
            <p>One item per line. Record testable criteria and actual evidence. Resolve open questions explicitly; proposals alone do not resolve gaps.</p>
            <div className="workshop-fields">
              {([
                ['outcome', 'Business outcome'], ['users', 'Intended users'],
                ['inScope', 'In-scope MVP capabilities'], ['outOfScope', 'Out-of-scope and production exclusions'],
                ['constraints', 'Constraints and dependencies'], ['assumptions', 'Assumptions'],
                ['criteria', 'Testable success criteria'], ['evidence', 'Required verification evidence'],
                ['questions', 'Open questions'], ['resolutions', 'Gap validation and question resolutions'],
              ] as const).map(([field, label]) => (
                <div key={field} className="workshop-field">
                  <label htmlFor={`${key}-${field}`}>{label}</label>
                  <textarea id={`${key}-${field}`} value={draft[field]} onChange={e => patch({ [field]: e.target.value })} />
                </div>
              ))}
              <label>Chosen execution workflow
                <select value={draft.execution} onChange={e => patch({ execution: e.target.value as WorkshopDraft['execution'] })}>
                  <option value="agentic-loop">Existing Agentic Loop build hand-off</option>
                  <option value="threadlight-pipeline">Shipped Threadlight delivery workflow (validate prerequisites)</option>
                </select>
              </label>
            </div>
            <details><summary>Structured specification (source of truth)</summary><pre className="workshop-spec">{formatWorkshopSpec(spec)}</pre></details>
            <div className="prompt-actions">
              <button className="craft-btn" disabled={!canApproveSpec(spec)} onClick={() => update(key, { ...draft, approved: formatWorkshopSpec(spec) })}>
                Approve scope and specification
              </button>
              <button className="craft-btn primary" disabled={!approved} onClick={() => setModalOpen(true)}>
                <Rocket size={15} /> Craft prompt and build hand-off
              </button>
            </div>
            <p role="status">{approved ? 'Approved specification is current.' : 'Approval requires an outcome, users, scope, criteria, evidence and explicit gap/question resolutions.'}</p>
          </section>
          {advisorPackage && (
            <div className="advisor-package-preview">
              <SkillCard title="Build SKILLs" icon={<Wrench size={14} />} sub="Skills from the chosen maintained guidance." skills={advisorPackage.buildSkills} />
              <SkillCard title="Run SKILLs" icon={<Rocket size={14} />} sub="Optional maintained run skills, selected in the hand-off." skills={advisorPackage.runSkills} />
            </div>
          )}
        </div>
      )}

      <MakeItRealModal
        open={modalOpen && approved}
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
