import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Brain, ImageIcon, Volume2, Headphones, MessagesSquare,
  FileSearch, BookOpen, Eye, ShieldCheck, Network, Database, Workflow,
  Building2, GraduationCap, Wrench, Rocket,
  Plug, KeyRound, HardDrive, Users, UserCheck, ArrowRight,
} from 'lucide-react';
import type { PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';
import {
  buildAdvisorPackage,
  inferRequirementsFromSelections,
} from '../data/advisor';
import { playbooks, ROLE_LABELS, type Scenario } from '../data/catalog';
import workshopBriefs from '../data/workshop-briefs.json';
import {
  recommendWorkshop, formatWorkshopSpec, approvalIsCurrent, canApproveSpec,
  withRequiredCapabilities, type WorkshopSpec,
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
  strong: 'Reusable starting point',
  partial: 'Partly covered',
  none: 'Custom approach needed',
  clarification: 'Clarify the brief',
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
    if (scenario) {
      const matchOptions = (values: string[], options: PickerOption[]) => options
        .filter(option => values.some(value => value === option.id || value.toLowerCase() === option.label.toLowerCase() ||
          option.id === 'knowledge' && value === 'Knowledge'))
        .map(option => option.id);
      draft.capabilities = withRequiredCapabilities(matchOptions(scenario.capabilities ?? [], CAPABILITIES));
      draft.buildingBlocks = [...new Set([...draft.buildingBlocks, ...matchOptions(scenario.buildingBlocks ?? [], BUILDING_BLOCKS)])];
      draft.patterns = matchOptions(scenario.patterns ?? [], THEMES);
    }
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
      if ('brief' in values) { next.outcome = ''; next.inScope = ''; next.resolutions = ''; }
    }
    latestDraft.current = next;
    update(key, next);
    setError('');
  }

  const acceptedSuggestions = draft.proposal?.suggestions.filter(s => draft.acceptedIds.includes(`${s.kind}:${s.id}`)) ?? [];
  const selectionIds = (kind: 'capabilities' | 'buildingBlocks' | 'patterns') => [
    ...new Set([...draft[kind], ...acceptedSuggestions.filter(s => s.kind === kind && s.source === 'catalog').map(s => s.id)]),
  ];
  const capabilities = withRequiredCapabilities(selectionIds('capabilities'));
  const buildingBlocks = selectionIds('buildingBlocks');
  const patterns = selectionIds('patterns');
  const selectedIds = [...capabilities, ...buildingBlocks, ...patterns];
  const coverage = recommendWorkshop(draft.brief, selectedIds,
    [...lines(draft.customCapabilities), ...lines(draft.customBlocks), ...lines(draft.customPatterns)]);
  const chosenGuides = playbooks.filter(p => p.role !== 'onboarding' &&
    ((!draft.removedGuideIds.includes(p.slug) &&
      (draft.manualGuideIds.includes(p.slug) || coverage.guides.some(g => g.playbook.slug === p.slug))) ||
      draft.execution === 'threadlight-pipeline' && p.slug === 'threadlight-pipeline'));
  const proposedGuides = playbooks.filter(p => chosenGuides.includes(p) || coverage.guides.some(g => g.playbook.slug === p.slug));
  const otherGuides = playbooks.filter(p => p.role !== 'onboarding' && !proposedGuides.includes(p));
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
  const canContinue = canApproveSpec(spec) && !busy;
  const missingDetails = [
    !spec.users.trim() && 'Add who will use the pilot.',
    !spec.successCriteria.length && 'Define what success looks like.',
    (spec.gaps.length || spec.openQuestions.length) && !spec.resolutions.trim() && 'Add scope notes that resolve the remaining gaps and questions.',
    spec.acceptedSuggestions.some(s => !s.label.trim() || !s.reason.trim()) && 'Complete each selected suggestion.',
  ].filter(Boolean);
  const nextStepStatus = busy ? 'Wait for the analysis to finish, or cancel it before continuing.'
    : missingDetails.length ? missingDetails.join(' ')
    : approved ? 'Scope confirmed. Your build prompt is ready to reopen.'
    : 'Your scope is ready to confirm.';
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
  function openBuildPrompt() {
    if (canContinue) {
      update(key, { ...draft, approved: formatWorkshopSpec(spec) });
      setModalOpen(true);
    }
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
    const selections = field === 'capabilities' ? withRequiredCapabilities(ids) : ids;
    patch({
      [field]: selections,
      acceptedIds: draft.acceptedIds.filter(key => !key.startsWith(`${field}:`) || selections.includes(key.slice(field.length + 1))),
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
        </div>
      </div>
      <section className="workshop-technical" aria-labelledby={`technical-${key}`}>
        <h3 id={`technical-${key}`}>Technical requirements</h3>
        <p className="muted">Adjust the starting selections for your pilot. Patterns are candidates, not a final architecture.</p>
        <div className="workshop-options-grid">
          {([
            ['capabilities', 'Capabilities', CAPABILITIES, capabilities, Brain],
            ['buildingBlocks', 'Building blocks', BUILDING_BLOCKS, buildingBlocks, ShieldCheck],
            ['patterns', 'Candidate patterns', THEMES, patterns, Workflow],
          ] as const).map(([field, label, options, selected, Icon]) => (
            <fieldset className="workshop-option-column" key={field}>
              <legend><Icon size={16} /> {label}</legend>
              {options.map(option => (
                <label className="workshop-option" key={option.id}>
                  <input type="checkbox" checked={selected.includes(option.id)} disabled={option.id === 'frontier-models'}
                    aria-describedby={option.id === 'frontier-models' ? `frontier-help-${key}` : undefined} onChange={e =>
                    changeSelection(field, e.target.checked ? [...selected, option.id] : selected.filter(id => id !== option.id))
                  } />
                  <span><span className="workshop-option-label">{option.label}{option.id === 'frontier-models' && <span className="workshop-required">Required</span>}</span>
                    <small>{option.description}</small>
                    {option.id === 'frontier-models' && <small id={`frontier-help-${key}`}>The model foundation for every pilot.</small>}
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </section>
      <div className="prompt-actions">
        <button className="craft-btn primary" onClick={prepare} disabled={!draft.brief.trim()}>
          <Sparkles size={15} /> Prepare workshop
        </button>
      </div>

      {draft.prepared && (
        <div className="workshop-plan">
          <section className="workshop-section workshop-proposal" aria-label="Proposed workshop approach">
            <div className="workshop-section-heading">
              <h3>Proposed workshop approach</h3>
              <span className="workshop-match">{COVERAGE_LABELS[coverage.state]}</span>
            </div>
            <p>{coverage.state === 'strong'
              ? 'We found existing implementation guidance for your requirements. Adapt it to your customer instead of starting from scratch.'
              : 'Use existing guidance where it fits and define a customer-specific approach for the remaining requirements.'}</p>
            <p className="workshop-proposal-explanation">This is a proposal, not a built or deployed app. Including a guide adds a link to its implementation instructions and recommended build skills to your Copilot prompt; it does not add a new capability automatically.</p>
            {coverage.questions.map(q => <p key={q} className="workshop-warning">{q}</p>)}
            {coverage.unsupported.map(q => <p key={q} className="workshop-warning">{q}</p>)}
            {proposedGuides.map(guide => {
              const recommendation = coverage.guides.find(g => g.playbook.slug === guide.slug);
              const included = chosenGuides.includes(guide);
              return (
                <article key={guide.slug} className="workshop-proposed-guide" aria-label={guide.name}>
                  <div className="workshop-guide-heading">
                    <div><span className="workshop-guide-type">{guide.role === 'capability' ? 'Reusable implementation guide' : ROLE_LABELS[guide.role]}</span><h4>{guide.name}</h4></div>
                    <label className="workshop-include">
                      <input type="checkbox" aria-label={`Include ${guide.name} in build prompt`} checked={included}
                        disabled={draft.execution === 'threadlight-pipeline' && guide.slug === 'threadlight-pipeline'} onChange={e => patch({
                        removedGuideIds: e.target.checked ? draft.removedGuideIds.filter(id => id !== guide.slug) : [...draft.removedGuideIds, guide.slug],
                        manualGuideIds: e.target.checked ? [...new Set([...draft.manualGuideIds, guide.slug])] : draft.manualGuideIds.filter(id => id !== guide.slug),
                      })} />
                      {included ? 'Included in build prompt' : 'Include in build prompt'}
                    </label>
                  </div>
                  <dl className="workshop-guide-explanation">
                    <div><dt>Why it fits your brief</dt><dd>{recommendation
                      ? coverage.requirements.filter(r => recommendation.covers.includes(r.id)).map(r => r.label).join('; ')
                      : 'Added manually. Confirm that this guide fits your customer before approving.'}</dd></div>
                    <div><dt>What you can reuse</dt><dd>{guide.summary}</dd></div>
                    <div><dt>What needs adapting</dt><dd>{guide.adaptation} The example is a starting point, not your final customer app.</dd></div>
                  </dl>
                  <div className="workshop-guide-boundaries">
                    <p><strong>Confirm before building:</strong> {guide.prerequisites.join('; ')}.</p>
                    <p><strong>Not included:</strong> {guide.exclusions.join('; ')}.</p>
                  </div>
                  <Link className="workshop-guide-link" to={`/playbooks/${guide.slug}`}>Read {guide.name} implementation guide</Link>
                </article>
              );
            })}
            {otherGuides.length > 0 && <div className="workshop-add-guide">
              <label htmlFor={`add-guide-${key}`}>Add another guide (optional)</label>
              <select id={`add-guide-${key}`} aria-describedby={`add-guide-help-${key}`} value="" onChange={e => {
                const slug = e.target.value;
                if (otherGuides.some(guide => guide.slug === slug)) patch({
                  manualGuideIds: [...new Set([...draft.manualGuideIds, slug])],
                  removedGuideIds: draft.removedGuideIds.filter(id => id !== slug),
                });
              }}>
                <option value="">Choose a guide to review</option>
                {otherGuides.map(guide => <option key={guide.slug} value={guide.slug}>{guide.name}</option>)}
              </select>
              <small id={`add-guide-help-${key}`}>Only add guidance that fits this pilot. A manual choice does not prove technical feasibility.</small>
            </div>}
            {spec.gaps.length > 0 && <div className="workshop-remaining">
              <h4>Still needs a customer-specific decision</h4>
              <ul>{spec.gaps.map((gap, index) => <li key={index}>{gap}</li>)}</ul>
              <p>Resolve these in scope notes, choose suitable guidance, or explicitly exclude them from the pilot.</p>
            </div>}
            {coverage.gaps.length > 0 && (
              <div className="workshop-gaps">
                <p>Copilot can propose options for the requirements without a matching guide. You decide which suggestions to keep.</p>
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
            <section className="workshop-section" aria-label="Provisional AI suggestions">
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
          <section className="workshop-section workshop-review" aria-label="Review workshop">
            <h3>Review workshop</h3>
            <p>Confirm who this pilot is for, what success looks like, and any scope decisions.</p>
            <div className="workshop-brief-summary">
              <h4>Pilot brief</h4>
              <p>{draft.brief}</p>
              <small>Approved sample data, authorized access and recorded scenario/access tests are required. Production rollout is excluded.</small>
            </div>
            <div className="workshop-fields">
              {([
                ['users', 'Who will use the pilot?', 'For example, HR staff testing approved sample policies'],
                ['criteria', 'What does success look like?', 'For example, answers cite approved sources and refuse unsupported questions'],
                ['resolutions', 'Scope notes and decisions', 'Add constraints, exclusions, or decisions that resolve the gaps and questions above'],
              ] as const).map(([field, label, placeholder]) => (
                <div key={field} className="workshop-field">
                  <label htmlFor={`${key}-${field}`}>{label}</label>
                  <textarea id={`${key}-${field}`} placeholder={placeholder} required={field !== 'resolutions' || Boolean(spec.gaps.length || spec.openQuestions.length)}
                    value={draft[field]} onChange={e => patch({ [field]: e.target.value })} />
                  {field === 'resolutions' && <small className="muted">
                    {spec.gaps.length || spec.openQuestions.length ? 'Required: record how each uncovered requirement or open question will be handled.' : 'Optional for a fully covered pilot.'}
                  </small>}
                </div>
              ))}
            </div>
            <div className="workshop-workflow">
              <label htmlFor={`workflow-${key}`}>Build workflow</label>
              <select id={`workflow-${key}`} value={draft.execution} onChange={e => {
                if (e.target.value === 'agentic-loop' || e.target.value === 'threadlight-pipeline') patch({ execution: e.target.value });
              }}>
                <option value="agentic-loop">Existing Agentic Loop build hand-off</option>
                <option value="threadlight-pipeline">Shipped Threadlight delivery workflow (validate prerequisites)</option>
              </select>
            </div>
            <div className="workshop-next-step">
              <div>
                <h4>Get your build prompt</h4>
                <p>Confirm this scope, then copy your prompt into Copilot. Nothing runs until you start it there.</p>
                <p id={`continue-status-${key}`} className="workshop-next-status" role="status">{nextStepStatus}</p>
              </div>
              <button className="craft-btn primary" disabled={!canContinue} aria-describedby={`continue-status-${key}`} onClick={openBuildPrompt}>
                {approved ? 'Open build prompt' : 'Confirm scope & get prompt'} <ArrowRight size={15} />
              </button>
            </div>
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
