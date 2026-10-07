import { playbooks, type Playbook } from './catalog';

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
  { id: 'knowledge-grounding', label: 'Grounded answers with citations', pattern: /\b(citations?|cited|rag|grounded|grounding|knowledge|documents?|policy answers|hr.polic(?:y|ies))\b/i, selections: ['knowledge', 'knowledge-grounding'] },
  { id: 'voice', label: 'Real-time voice interaction', pattern: /\b(voice|speech|spoken|barge.in)\b/i, selections: ['realtime', 'text-to-speech', 'speech-to-text'] },
  { id: 'multi-agent', label: 'Heterogeneous agents with typed hand-offs', pattern: /\b(multi.agent|heterogeneous agents|agent.to.agent)\b/i, selections: ['multi-agent'] },
  { id: 'governance', label: 'Policy boundaries and safety controls', pattern: /\b(safety controls|regulated|red.team|sensitive data|claims assistant|policy enforcement)\b/i, selections: [] },
  { id: 'evals', label: 'Continuous evaluation and regression gates', pattern: /\b(evals?|regression|continuous evaluation|trace mining)\b/i, selections: [] },
  { id: 'reusable-skills', label: 'Govern existing agent skills', pattern: /\b(existing skills|own skills|versioned skills|governed skills)\b/i, selections: [] },
  { id: 'ai-gateway', label: 'Governed shared AI gateway', pattern: /\b(ai gateway|apim|shared foundry capacity|citadel)\b/i, selections: ['ai-gateway'] },
  { id: 'delivery', label: 'Opinionated end-to-end delivery pipeline', pattern: /\b(threadlight|opinionated pipeline|production scorecard|eu ai act evidence pack)\b/i, selections: [] },
  { id: 'integration', label: 'Customer-specific system integration', pattern: /\b(integrat(?:e|es|ion|ing)|connectors?|connect(?:ing)? (?:to|with)|sap|salesforce|servicenow|m365|microsoft graph|microsoft teams|teams (?:bot|channel)|outlook|sharepoint|mcp)\b/i, selections: [] },
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

export interface WorkshopSpec {
  brief: string;
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
  candidatePatterns: string[];
  execution: 'agentic-loop' | 'threadlight-pipeline';
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
    section('Capabilities', spec.capabilities),
    section('Building blocks', spec.buildingBlocks),
    section('Candidate patterns', spec.candidatePatterns),
    section('Build workflow', spec.execution === 'threadlight-pipeline' ? 'Threadlight pipeline' : 'Agentic Loop /spec2cloud'),
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
