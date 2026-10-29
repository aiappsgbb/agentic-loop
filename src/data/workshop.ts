import { playbooks, type Playbook } from './catalog';
import { buildWorkflowLabel, type BuildExecution } from './buildWorkflow';
import {
  FOUNDRY_MODELS, MODEL_CAPABILITY_OPTIONS, AGENT_CAPABILITY_OPTIONS, AGENT_CAPABILITY_LINKS,
  ARCHITECTURE_NODES, ARCHITECTURE_OPTIONS, WORKSHOP_CAPABILITY_OPTIONS, canonicalArchitectureLabel, normalizeWorkshopSelections, withObservability,
  type FoundryModelId, type WorkshopSelections,
} from './architecture';

export type CoverageState = 'strong' | 'partial' | 'none' | 'clarification' | 'unsupported';
export function withRequiredCapabilities(ids: readonly string[]): string[] {
  return [...new Set(['frontier-models', ...ids])];
}
export interface RequirementEvidence { id: string; label: string; evidence: string }
export interface GuideRecommendation { playbook: Playbook; covers: string[]; reasons: string[] }
export interface Coverage {
  state: CoverageState;
  requirements: RequirementEvidence[];
  guides: GuideRecommendation[];
  gaps: RequirementEvidence[];
  questions: string[];
  unsupported: string[];
}

const RULES: Array<{ id: string; label: string; pattern: RegExp; selections: string[] }> = [
  { id: 'knowledge-grounding', label: 'Grounded answers with citations', pattern: /\b(citations?|cited|rag|grounded|grounding|knowledge|documents?|policy answers|hr.polic(?:y|ies))\b/i, selections: ['knowledge', 'knowledge-grounding', 'ai-search'] },
  { id: 'voice', label: 'Real-time speech-to-speech interaction', pattern: /\b(voice.first|real.time (?:voice|audio|conversations?)|speech.to.speech|barge.in|spoken conversations?)\b/i, selections: ['realtime'] },
  { id: 'text-to-speech', label: 'Text to speech', pattern: /\b(text.to.speech|tts|speech synthesis|read aloud|read .{0,80} aloud)\b/i, selections: ['text-to-speech'] },
  { id: 'speech-to-text', label: 'Speech to text', pattern: /\b(speech.to.text|stt|transcri(?:be|ption|bing))\b/i, selections: ['speech-to-text'] },
  { id: 'multi-agent', label: 'Heterogeneous agents with typed hand-offs', pattern: /\b(multi.agent|heterogeneous agents|agent.to.agent)\b/i, selections: ['multi-agent'] },
  { id: 'agent-memory', label: 'Agent Memory across conversations', pattern: /\bagent memory\b/i, selections: ['agent-memory'] },
  { id: 'governance', label: 'Policy boundaries and safety controls', pattern: /\b(safety controls|regulated|red.team|sensitive data|claims assistant|policy enforcement)\b/i, selections: ['content-safety'] },
  { id: 'evals', label: 'Continuous evaluation and regression gates', pattern: /\b(evals?|regression|continuous evaluation|trace mining)\b/i, selections: ['evals'] },
  { id: 'web-iq', label: 'WebIQ public-web grounding', pattern: /\bweb\s?iq\b/i, selections: ['web-iq'] },
  { id: 'agent-optimizer', label: 'Agent Optimizer', pattern: /\bagent optimizer\b/i, selections: ['agent-optimizer'] },
  { id: 'agent-insights', label: 'Agent Insights', pattern: /\bagent insights\b/i, selections: ['agent-insights'] },
  { id: 'reusable-skills', label: 'Govern existing agent skills', pattern: /\b(existing skills|own skills|versioned skills|governed skills)\b/i, selections: [] },
  { id: 'ai-gateway', label: 'Governed shared AI gateway', pattern: /\b(ai gateway|apim|shared foundry capacity|citadel)\b/i, selections: ['ai-gateway'] },
  { id: 'delivery', label: 'Opinionated end-to-end delivery pipeline', pattern: /\b(threadlight|opinionated pipeline|production scorecard|eu ai act evidence pack)\b/i, selections: [] },
  { id: 'integration', label: 'Customer-specific system integration', pattern: /\b(integrat(?:e|es|ion|ing)|connectors?|connect(?:ing)? (?:to|with)|sap|salesforce|servicenow|m365|microsoft graph|microsoft teams|teams (?:bot|channel)|outlook|sharepoint|mcp)\b/i, selections: ['toolbox', 'work-iq', 'fabric-iq'] },
  { id: 'image-generation', label: 'Image generation', pattern: /\b(image generation|generate images?|create images?)\b/i, selections: ['image-generation'] },
  { id: 'forms', label: 'Structured document extraction', pattern: /\b(extract|form recognition|document intelligence|ocr)\b/i, selections: ['forms'] },
  { id: 'private-networking', label: 'Private networking', pattern: /\b(private network|private endpoint|vnet)\b/i, selections: ['private-net'] },
  { id: 'data-persistence', label: 'Durable application state', pattern: /\b(database|persist(?:ent|ence)?|cosmos|postgres)\b/i, selections: ['data'] },
  { id: 'offline', label: 'Offline or air-gapped runtime', pattern: /\b(offline runtime|air.gapped|no cloud|without (?:network|internet))\b/i, selections: [] },
  { id: 'residency', label: 'Customer-specific residency constraints', pattern: /\b(data residency|eu.only|sovereign)\b/i, selections: [] },
];

export function recommendWorkshop(brief: string, selections: string[] = [], customRequirements: string[] = []): Coverage {
  const text = brief.trim();
  const requirements = RULES.flatMap(rule => {
    const match = text.match(rule.pattern);
    const selection = selections.find(id => rule.selections.includes(id));
    return match || selection ? [{ id: rule.id, label: rule.label, evidence: match?.[0] ?? `Selected ${selection}` }] : [];
  });
  const unsupported = /\b(bypass (?:access|permissions|consent)|without consent|guarantee (?:zero hallucinations|perfect accuracy))\b/i.test(text)
    ? ['Bypassing access/consent or guaranteeing perfect model accuracy is not a supported workshop requirement. Scope an authorized, evidence-tested alternative.'] : [];
  if (/\bunsupported (?:integration|connector|interface)|\b(?:integration|connector) .{0,80}\bnot supported\b/i.test(text)) {
    unsupported.push('The brief identifies an unsupported integration. Validate an approved interface or explicitly exclude it; a manual/sample-data alternative is not a working integration.');
  }
  const questions: string[] = [];
  if (!text || /\b(something|help me|make an? ai|build an? agent)\b/i.test(text) && text.split(/\s+/).length < 9) {
    questions.push('What should the customer be able to do, and who will use it?');
  }
  if (text && text.split(/\s+/).length < 5) questions.push('Describe an observable customer outcome before selecting an approach.');

  // Hints are evidence, not authority: retain unrecognized requested clauses as gaps.
  const clauses = text.split(/[;\n.]|\band\b/i).map(clause => clause.trim()).filter(Boolean);
  const unknown = clauses.filter(clause => {
    const substantiveAction = /\b(predict|optimi[sz]e|schedule|simulate|translate|forecast|recommend|automate|detect|calculate|synchroni[sz]e|personali[sz]e|teleport)\b/i.test(clause);
    const unrecognizedRequest = !RULES.some(rule => rule.pattern.test(clause)) &&
      /\b(route|generate|control|must|requires?|needs?)\b/i.test(clause);
    return substantiveAction || unrecognizedRequest;
  });
  unknown.forEach((clause, i) => requirements.push({ id: `custom-${i}`, label: clause, evidence: clause }));
  customRequirements.forEach((label, i) => requirements.push({ id: `custom-manual-${i}`, label, evidence: `Explicit custom selection: ${label}` }));
  if (text && !requirements.length && !questions.length) {
    requirements.push({ id: 'customer-outcome', label: text, evidence: text });
  }

  const guides = playbooks.flatMap(playbook => {
    if (playbook.role === 'onboarding') return [];
    const covers = requirements.filter(r => playbook.addresses.includes(r.id)).map(r => r.id);
    if (!covers.length) return [];
    return [{
      playbook,
      covers,
      reasons: requirements.filter(r => covers.includes(r.id)).map(r => `${r.label}: "${r.evidence}"`),
    }];
  });
  const gaps = requirements.filter(r => !guides.some(g => g.covers.includes(r.id)));
  const state = unsupported.length ? 'unsupported' : questions.length ? 'clarification'
    : !guides.length ? 'none' : gaps.length ? 'partial' : 'strong';
  return { state, requirements, guides, gaps, questions, unsupported };
}

export type WorkshopRequirementSources = Record<keyof WorkshopSelections, Record<string, string[]>>;

export function resolvePlaybookSelections(raw: WorkshopSelections, guides: readonly Playbook[]) {
  const selections = normalizeWorkshopSelections(raw);
  const requiredBy: WorkshopRequirementSources = { capabilities: {}, buildingBlocks: {}, patterns: {} };
  function requireSelection(field: keyof WorkshopSelections, id: string, name: string) {
    const linked = field === 'patterns' ? AGENT_CAPABILITY_LINKS[id] : undefined;
    const target = linked?.field ?? field;
    const targetId = linked?.id ?? id;
    selections[target] = [...new Set([...selections[target], targetId])];
    requiredBy[target][targetId] = [...new Set([...(requiredBy[target][targetId] ?? []), name])];
    if (target === 'buildingBlocks' && targetId === 'observability') requireSelection('buildingBlocks', 'app-insights', name);
  }
  for (const guide of guides) {
    for (const [field, values, options] of [
      ['capabilities', guide.capabilities ?? [], WORKSHOP_CAPABILITY_OPTIONS],
      ['buildingBlocks', guide.building_blocks ?? [], ARCHITECTURE_OPTIONS.filter(option => option.field === 'buildingBlocks')],
    ] as const) {
      for (const value of values) {
        const option = options.find(option => option.id === value || option.label === canonicalArchitectureLabel(value));
        if (!option) throw new Error(`Unknown ${field} requirement "${value}" in playbook ${guide.slug}`);
        requireSelection(field, option.id, guide.name);
      }
    }
    for (const option of AGENT_CAPABILITY_OPTIONS) {
      if (guide.patterns.includes(option.label) || guide.patterns.includes(option.id)) requireSelection('patterns', option.id, guide.name);
    }
  }
  selections.capabilities = withRequiredCapabilities(selections.capabilities);
  selections.buildingBlocks = withObservability(selections.buildingBlocks);
  return { selections, requiredBy };
}

export interface WorkshopSpec {
  brief: string;
  model: FoundryModelId;
  outcome: string;
  users: string;
  inScope: string[];
  outOfScope: string[];
  constraints: string[];
  assumptions: string[];
  successCriteria: string[];
  evidence: string[];
  capabilities: string[];
  buildingBlocks: string[];
  agentCapabilities: string[];
  architecture: string[];
  execution: BuildExecution;
  guides: Array<{ slug: string; reason: string }>;
  gaps: string[];
  openQuestions: string[];
  resolutions: string;
}

export const ESSENTIAL_SAFEGUARDS = [
  'Use approved sample data, minimize sensitive data, enforce authorized access and least-privilege identity.',
  'Verify scenario behavior, access boundaries, refusals and failure paths with recorded evidence before pilot use.',
];
export function formatWorkshopSpec(spec: WorkshopSpec): string {
  return JSON.stringify(spec, null, 2);
}
export function formatWorkshopSpecMarkdown(spec: WorkshopSpec): string {
  const modelCapabilities = MODEL_CAPABILITY_OPTIONS.filter(option => spec.capabilities.includes(option.label));
  const agentGuidance = AGENT_CAPABILITY_OPTIONS.flatMap(option =>
    spec.agentCapabilities.includes(option.label) && 'buildGuidance' in option
      ? [`${option.label}: ${option.buildGuidance}`] : []);
  const componentGuidance = ARCHITECTURE_NODES.filter(node => node.buildGuidance &&
    (node.selection?.field === 'capabilities' ? spec.capabilities : spec.buildingBlocks).includes(node.label));
  const referenceBrief = (text: string) =>
    spec.brief.trim() && text.trim() === spec.brief.trim() ? 'See Customer brief.' : text;
  const section = (title: string, content: string | string[]) =>
    `### ${title}\n\n${Array.isArray(content)
      ? content.length ? content.map(item => `- ${referenceBrief(item).replace(/\n/g, '\n  ')}`).join('\n') : '- None specified.'
      : (title === 'Customer brief' ? content : referenceBrief(content)).trim() || 'None specified.'}`;
  return [
    '## Confirmed customer workshop specification',
    section('Customer brief', spec.brief),
    section('Expected outcome', spec.outcome),
    section('Intended users', spec.users),
    section('In scope', spec.inScope),
    section('Out of scope', spec.outOfScope),
    section('Constraints', spec.constraints),
    section('Assumptions', spec.assumptions),
    section('Success criteria', spec.successCriteria),
    section('Verification evidence', spec.evidence),
    section('Foundry model', `${FOUNDRY_MODELS[spec.model]} (${spec.model}). ${spec.model === 'auto'
      ? 'Copilot selects a suitable model during the build based on scope and availability in the chosen Foundry project.'
      : 'Use this requested model; validate availability and quota in the chosen Foundry project before deployment. Do not silently substitute another model.'}`),
    section('Capabilities', spec.capabilities),
    ...(modelCapabilities.length ? [
      section('Capability model candidates', modelCapabilities.map(option => `${option.label}: ${option.models.join(' or ')}`)),
      'Use one of the listed models for each selected capability, alongside the reasoning model where needed. Validate availability, quota and feature support in the chosen Foundry project; report blockers and confirm any substitution before proceeding.',
      ...(modelCapabilities.some(option => option.id === 'realtime')
        ? ['Real-Time Conversations requires true speech-to-speech using gpt-live-1. Do not substitute a chained speech-to-text, reasoning and text-to-speech pipeline. Standalone TTS or STT models are required only when those separate capabilities are selected.']
        : []),
    ] : []),
    section('Building blocks', spec.buildingBlocks),
    section('Agent capabilities', spec.agentCapabilities),
    ...(agentGuidance.length ? [section('Selected agent capability guidance', agentGuidance)] : []),
    section('Selected reference architecture', spec.architecture),
    ...(componentGuidance.length ? [
      section('Selected component guidance', componentGuidance.map(node => `${node.label}: ${node.buildGuidance}`)),
    ] : []),
    section('Build workflow', buildWorkflowLabel(spec.execution)),
    section('Selected guides', spec.guides.map(guide => `${guide.slug}: ${guide.reason}`)),
    section('Remaining gaps', spec.gaps),
    section('Open questions', spec.openQuestions),
    section('Scope notes and decisions', spec.resolutions),
  ].join('\n\n');
}
export function approvalIsCurrent(spec: WorkshopSpec, approved: string | null): boolean {
  return approved !== null && approved === formatWorkshopSpec(spec);
}
export function canApproveSpec(spec: WorkshopSpec): boolean {
  return Boolean(spec.brief.trim() && spec.outcome.trim() && spec.users.trim() && spec.inScope.length &&
    spec.successCriteria.length && spec.evidence.length &&
    ((!spec.gaps.length && !spec.openQuestions.length) || spec.resolutions.trim()));
}
