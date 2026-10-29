import { useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Brain, Workflow, Wrench, Rocket, ArrowRight, X,
} from 'lucide-react';
import type { PickerOption } from './CapabilityPicker';
import MakeItRealModal from './MakeItRealModal';
import ArchitectureStrip from './ArchitectureStrip';
import {
  ARCHITECTURE_OPTIONS, AGENT_CAPABILITY_LINKS, AGENT_CAPABILITY_OPTIONS, FOUNDRY_MODELS, MODEL_CAPABILITY_OPTIONS,
  WORKSHOP_CAPABILITY_OPTIONS, normalizeWorkshopSelections, selectedArchitecture,
} from '../data/architecture';
import {
  buildAdvisorPackage,
  inferRequirementsFromSelections,
} from '../data/advisor';
import { playbooks, ROLE_LABELS, type Scenario } from '../data/catalog';
import workshopBriefs from '../data/workshop-briefs.json';
import {
  recommendWorkshop, formatWorkshopSpec, approvalIsCurrent, canApproveSpec,
  withRequiredCapabilities, resolvePlaybookSelections, type WorkshopSpec,
} from '../data/workshop';
import { WorkshopContext, newWorkshopDraft, type WorkshopDraft } from './WorkshopContext';

const CAPABILITIES: PickerOption[] = WORKSHOP_CAPABILITY_OPTIONS;

const BUILDING_BLOCKS: PickerOption[] = ARCHITECTURE_OPTIONS.filter(option => option.field === 'buildingBlocks');
const MODEL_CAPABILITIES = CAPABILITIES.filter(option => MODEL_CAPABILITY_OPTIONS.some(model => model.id === option.id));

const AGENT_CAPABILITIES: PickerOption[] = AGENT_CAPABILITY_OPTIONS;

const labelMap = new Map([...CAPABILITIES, ...BUILDING_BLOCKS, ...AGENT_CAPABILITIES].map(o => [o.id, o.label]));
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
      draft.patterns = matchOptions(scenario.patterns ?? [], AGENT_CAPABILITIES);
    }
    if (guideSlug && playbooks.some(p => p.slug === guideSlug && p.role !== 'onboarding')) {
      draft.manualGuideIds = [guideSlug];
      if (guideSlug === 'threadlight-pipeline') draft.execution = 'threadlight-pipeline';
    }
    return { ...draft, ...normalizeWorkshopSelections(draft) };
  }, [scenario, guideSlug]);
  const draft = drafts[key] ?? seed;
  const [modalOpen, setModalOpen] = useState(false);

  function patch(values: Partial<WorkshopDraft>, upstream = false) {
    const next = { ...draft, ...normalizeWorkshopSelections(draft), ...values, approved: null };
    if (upstream) {
      next.prepared = false;
      if ('brief' in values) { next.outcome = ''; next.inScope = ''; next.resolutions = ''; }
    }
    update(key, next);
  }

  const selections = normalizeWorkshopSelections(draft);
  const model = draft.model ?? 'auto';
  const coverage = recommendWorkshop(draft.brief, [...selections.capabilities, ...selections.buildingBlocks, ...selections.patterns],
    [...lines(draft.customCapabilities), ...lines(draft.customBlocks), ...lines(draft.customPatterns)]);
  const chosenGuides = playbooks.filter(p => p.role !== 'onboarding' &&
    ((!draft.removedGuideIds.includes(p.slug) &&
      draft.manualGuideIds.includes(p.slug)) ||
      draft.execution === 'threadlight-pipeline' && p.slug === 'threadlight-pipeline'));
  const { selections: effective, requiredBy } = resolvePlaybookSelections(selections, chosenGuides);
  const { capabilities, buildingBlocks } = effective;
  const patterns = [...effective.patterns, ...Object.entries(AGENT_CAPABILITY_LINKS).flatMap(([id, linked]) =>
    linked && effective[linked.field].includes(linked.id) ? [id] : [])];
  const selectedIds = [...capabilities, ...buildingBlocks, ...patterns];
  const proposedGuides = playbooks.filter(p => chosenGuides.includes(p) || coverage.guides.some(g => g.playbook.slug === p.slug));
  const otherGuides = playbooks.filter(p => p.role !== 'onboarding' && !proposedGuides.includes(p));
  const spec: WorkshopSpec = {
    brief: draft.brief, model, outcome: draft.outcome, users: draft.users,
    inScope: lines(draft.inScope), outOfScope: lines(draft.outOfScope),
    constraints: lines(draft.constraints), assumptions: lines(draft.assumptions),
    successCriteria: lines(draft.criteria), evidence: lines(draft.evidence),
    capabilities: [...capabilities.map(id => labelMap.get(id) ?? id), ...lines(draft.customCapabilities)],
    buildingBlocks: [...buildingBlocks.map(id => labelMap.get(id) ?? id), ...lines(draft.customBlocks)],
    agentCapabilities: [...AGENT_CAPABILITIES.filter(option => patterns.includes(option.id)).map(option => option.label), ...lines(draft.customPatterns)],
    architecture: selectedArchitecture({ capabilities, buildingBlocks }),
    execution: draft.execution,
    guides: chosenGuides.map(p => ({
      slug: p.slug,
      reason: coverage.guides.find(g => g.playbook.slug === p.slug)?.reasons.join('; ') ?? 'Explicit expert selection; suitability must be validated.',
    })),
    gaps: coverage.requirements.filter(r => !chosenGuides.some(p => p.addresses.includes(r.id))).map(r => r.label),
    openQuestions: [...coverage.questions, ...coverage.unsupported, ...lines(draft.questions),
      ...(draft.execution === 'threadlight-pipeline' ? ['Validate the shipped Threadlight prerequisites, opinionated scope and customer deployment boundaries.'] : [])],
    resolutions: draft.resolutions,
  };
  const approved = approvalIsCurrent(spec, draft.approved);
  const canContinue = canApproveSpec(spec);
  const missingDetails = [
    !spec.users.trim() && 'Add who will use the pilot.',
    !spec.successCriteria.length && 'Define what success looks like.',
    (spec.gaps.length || spec.openQuestions.length) && !spec.resolutions.trim() && 'Add scope notes that resolve the remaining gaps and questions.',
  ].filter(Boolean);
  const nextStepStatus = missingDetails.length ? missingDetails.join(' ')
    : approved ? 'Scope confirmed. Your build prompt is ready to reopen.'
    : 'Your scope is ready to confirm.';
  const advisorPackage = draft.prepared ? buildAdvisorPackage({
    path: scenario ? 'scenario' : 'idea',
    intent: draft.brief, scenario,
    requirementIds: inferRequirementsFromSelections(selectedIds),
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
  function changeSelection(field: 'capabilities' | 'buildingBlocks' | 'patterns', ids: string[]) {
    patch({ ...selections, [field]: field === 'capabilities' ? withRequiredCapabilities(ids) : ids }, true);
  }
  function toggleSelection(field: 'capabilities' | 'buildingBlocks' | 'patterns', id: string) {
    if (requirementLabel(field, id)) return;
    const selected = selections[field];
    changeSelection(field, selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  }
  function requirementLabel(field: 'capabilities' | 'buildingBlocks' | 'patterns', id: string) {
    const linked = field === 'patterns' ? AGENT_CAPABILITY_LINKS[id] : undefined;
    const sources = requiredBy[linked?.field ?? field][linked?.id ?? id];
    return sources?.length ? `Required by ${sources.join(', ')}` : undefined;
  }
  function setGuideIncluded(slug: string, included: boolean) {
    patch({
      manualGuideIds: included ? [...new Set([...draft.manualGuideIds, slug])] : draft.manualGuideIds.filter(id => id !== slug),
      removedGuideIds: included ? draft.removedGuideIds.filter(id => id !== slug) : [...new Set([...draft.removedGuideIds, slug])],
      ...(slug === 'threadlight-pipeline' ? { execution: included ? 'threadlight-pipeline' : 'agentic-loop' } : {}),
    });
  }

  return (
    <section className="greenfield" id="prompt">
      <div className="greenfield-head">
        <div className="section-eyebrow">{eyebrow ?? 'Customer workshop · Agentic Launchpad'}</div>
        <h2>{heading ?? 'Start a technical workshop'}</h2>
        <p>
          {intro ?? 'Turn customer requirements into a tailored MVP or pilot. Match maintained guidance, review scope, and prepare a build prompt in your browser. A workshop is not a production-readiness certification.'}
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
        <p className="muted">Adjust the starting selections for your pilot. The map records your choices; it does not infer an architecture from the customer brief.</p>
        {chosenGuides.length > 0 && <div className="workshop-included-guides" aria-label="Included playbooks">
          <span>Requirements from:</span>
          {chosenGuides.map(guide => <button key={guide.slug} type="button" className="workshop-guide-chip"
            aria-label={`Remove ${guide.name} playbook`} onClick={() => setGuideIncluded(guide.slug, false)}>
            {guide.name} <X size={13} aria-hidden="true" />
          </button>)}
        </div>}
        <ArchitectureStrip variant="full" selection={{
          values: { capabilities, buildingBlocks },
          model, onModelChange: model => patch({ model }, true),
          onToggle: toggleSelection, requiredBy: requirementLabel,
        }} />
        <div className="workshop-options-grid">
          {([
            ['capabilities', 'Model capabilities', MODEL_CAPABILITIES, capabilities, Brain],
            ['patterns', 'Agent capabilities', AGENT_CAPABILITIES, patterns, Workflow],
          ] as const).map(([field, label, options, selected, Icon]) => (
            <fieldset className="workshop-option-column" key={field}>
              <legend><Icon size={16} /> {label}</legend>
              <p className="workshop-option-help">{field === 'capabilities'
                ? 'Image and speech features may use dedicated models alongside the reasoning model. Support is validated during the build.'
                : 'Choose how the agent works. Grounding and domain expertise share the selections on the map above.'}</p>
              {options.map(option => (
                <label className="workshop-option" key={option.id}>
                  <input type="checkbox" checked={selected.includes(option.id)} aria-label={option.label}
                    disabled={Boolean(requirementLabel(field, option.id))}
                    aria-describedby={`${key}-${field}-${option.id}-help`} onChange={() => {
                    const linked = field === 'patterns' ? AGENT_CAPABILITY_LINKS[option.id] : undefined;
                    toggleSelection(linked?.field ?? field, linked?.id ?? option.id);
                  }} />
                  <span><span className="workshop-option-label">{option.label}</span>
                    <small id={`${key}-${field}-${option.id}-help`}>{option.description}
                      {requirementLabel(field, option.id) && <span className="workshop-required-note">{requirementLabel(field, option.id)}</span>}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <p className="workshop-pattern-note muted">Knowledge Grounding and Foundry IQ are one shared choice, as are Domain-Specific Agents and Skills. Human-in-the-Loop and Multi-Agent Orchestration describe behavior, not additional Azure services.</p>
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
            <p className="workshop-proposal-explanation">This is a proposal, not a built or deployed app. Recommendations use curated rules in your browser, not AI analysis. Suggested playbooks are not selected automatically. Including a playbook adopts and locks its required architecture and capabilities, and adds its implementation guidance to your build prompt. Remove the playbook to release those requirements; nothing is deployed here.</p>
            <p className="workshop-proposal-explanation"><strong>Learn while building.</strong> Playbooks provide context and a guided example so the Solution Engineer can explain the approach and teach the customer. On your first build, follow the relevant playbook; on later workshops, reuse the approach through a customer-specific prompt without repeating every step. Curated examples help demonstrate meaningful platform capabilities, not generic apps.</p>
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
                        onChange={e => setGuideIncluded(guide.slug, e.target.checked)} />
                      {included ? 'Included in build prompt' : 'Include in build prompt'}
                    </label>
                  </div>
                  <dl className="workshop-guide-explanation">
                    <div><dt>Why it fits your brief</dt><dd>{recommendation
                      ? coverage.requirements.filter(r => recommendation.covers.includes(r.id)).map(r => r.label).join('; ')
                      : 'Added manually. Confirm that this guide fits your customer before approving.'}</dd></div>
                    <div><dt>What you can reuse</dt><dd>{guide.summary}</dd></div>
                    <div><dt>What you'll explore</dt><dd>{[...(guide.capabilities ?? []), ...(guide.building_blocks ?? [])].map(label => label === 'Knowledge' ? 'Foundry IQ' : label).join('; ') || guide.use_when}. Use the playbook's context and guided example to explain how these apply to your customer.</dd></div>
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
                if (otherGuides.some(guide => guide.slug === slug)) setGuideIncluded(slug, true);
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
          </section>
          <section className="workshop-section workshop-review" aria-label="Review workshop">
            <h3>Review workshop</h3>
            <p>Confirm who this pilot is for, what success looks like, and any scope decisions.</p>
            <div className="workshop-brief-summary">
              <h4>Pilot brief</h4>
              <p>{draft.brief}</p>
              <small>Approved sample data, authorized access and recorded scenario/access tests are required. Production rollout is excluded.</small>
            </div>
            <div className="workshop-architecture-review">
              <h4>Selected architecture</h4>
              <p>{spec.architecture.join(' \u00b7 ')}</p>
              <p><strong>Foundry model:</strong> {FOUNDRY_MODELS[model]}{model === 'auto' ? ' (chosen during the build)' : ''}</p>
              <small>Included in your build prompt. Component details, model support and agent capabilities still need validation during the build.</small>
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
            <div className="workshop-remaining" aria-label="Foundry Agentic Loop build approach">
              <h4>One plugin, two ways to build</h4>
              <p>The <Link to="/skills/foundry-agentic-loop">foundry-agentic-loop build skill</Link> bundles setup, architecture defaults and mode selection with a companion canvas and SDD workflow. It translates the <Link to="/concepts/platform">reference architecture</Link> into a customer-specific solution, adding services only where your scope needs them.</p>
              <p><strong>Rapid</strong> builds and verifies locally in an existing Foundry project. <strong>SDD</strong> creates a project and runs Specify → Implement → Verify → Deploy, with planning folded into Specify, independent review and evidence gates. Review the spec before implementation; deployment always needs separate approval. The portal prepares the prompt, not the build.</p>
            </div>
            <div className="workshop-workflow">
              <label htmlFor={`workflow-${key}`}>Build workflow</label>
              <select id={`workflow-${key}`} value={draft.execution} onChange={e => {
                if (e.target.value === 'agentic-loop' || e.target.value === 'agentic-loop-rapid' || e.target.value === 'threadlight-pipeline') patch({
                  execution: e.target.value,
                  manualGuideIds: e.target.value === 'threadlight-pipeline'
                    ? [...new Set([...draft.manualGuideIds, 'threadlight-pipeline'])]
                    : draft.manualGuideIds.filter(id => id !== 'threadlight-pipeline'),
                  removedGuideIds: e.target.value === 'threadlight-pipeline'
                    ? draft.removedGuideIds.filter(id => id !== 'threadlight-pipeline')
                    : [...new Set([...draft.removedGuideIds, 'threadlight-pipeline'])],
                });
              }}>
                <option value="agentic-loop">Foundry Agentic Loop — SDD (new project, azd deployment)</option>
                <option value="agentic-loop-rapid">Foundry Agentic Loop — Rapid (existing Foundry project)</option>
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
