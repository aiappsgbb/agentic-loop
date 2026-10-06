import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { playbooks } from '../src/data/catalog';
import {
  recommendWorkshop, validateAIProposal, validateAnalysisRequest,
  approvalIsCurrent, formatWorkshopSpec, canApproveSpec, type WorkshopSpec,
  withRequiredCapabilities,
} from '../src/data/workshop';
import { buildAdvisorPackage, inferRequirementsFromSelections } from '../src/data/advisor';
import workshopBriefs from '../src/data/workshop-briefs.json';
import { newWorkshopDraft } from '../src/components/WorkshopContext';

const hr = 'Employees need HR policy answers grounded in approved documents with citations.';
test('three sample briefs cover reuse, gaps and a custom outcome without preapproving scope', () => {
  assert.equal(workshopBriefs.length, 3);
  assert.equal(new Set(workshopBriefs).size, 3);
  assert.deepEqual(workshopBriefs.map(brief => recommendWorkshop(brief).state), ['strong', 'partial', 'none']);
  for (const brief of workshopBriefs) {
    assert.ok(brief.length < 3000);
    const draft = newWorkshopDraft(brief);
    assert.equal(draft.brief, brief);
    assert.equal(draft.prepared, false);
    assert.equal(draft.approved, null);
    assert.ok(draft.capabilities.includes('frontier-models'));
    assert.deepEqual(draft.buildingBlocks, ['identity', 'observability']);
    assert.ok(!draft.patterns.includes('multi-agent'));
  }
  assert.deepEqual(newWorkshopDraft(workshopBriefs[0]).capabilities, ['frontier-models', 'knowledge']);
  assert.deepEqual(newWorkshopDraft(workshopBriefs[1]).patterns, ['knowledge-grounding']);
  assert.deepEqual(newWorkshopDraft(workshopBriefs[2]).patterns, ['human-in-the-loop']);
  assert.deepEqual(newWorkshopDraft('A customer-authored brief').capabilities, ['frontier-models']);
  assert.deepEqual(workshopBriefs.map(brief => {
    const draft = newWorkshopDraft(brief);
    return recommendWorkshop(brief, [...draft.capabilities, ...draft.buildingBlocks, ...draft.patterns]).state;
  }), ['strong', 'partial', 'none']);
});
test('frontier models are a required capability for fresh, empty and existing selections', () => {
  assert.deepEqual(newWorkshopDraft().capabilities, ['frontier-models']);
  assert.deepEqual(withRequiredCapabilities([]), ['frontier-models']);
  assert.deepEqual(withRequiredCapabilities(['knowledge']), ['frontier-models', 'knowledge']);
  assert.deepEqual(withRequiredCapabilities(['frontier-models', 'knowledge', 'frontier-models']), ['frontier-models', 'knowledge']);
});
test('HR citations reuse maintained grounding, never onboarding or wildcard workflows', () => {
  const result = recommendWorkshop(hr);
  assert.equal(result.state, 'strong');
  assert.deepEqual(result.guides.map(g => g.playbook.slug), ['enterprise-knowledge-grounding']);
  assert.match(result.guides[0].reasons[0], /documents|citations|policy/i);
  assert.equal(result.gaps.length, 0);
});
test('partial coverage preserves grounding and isolates the missing integration', () => {
  const result = recommendWorkshop(`${hr} Integrate with a custom payroll system.`);
  assert.equal(result.state, 'partial');
  assert.deepEqual(result.guides.map(g => g.playbook.slug), ['enterprise-knowledge-grounding']);
  assert.deepEqual(result.gaps.map(g => g.id), ['integration']);
});
test('novel, vague and empty briefs do not invent Weather/Threadlight architectures', () => {
  const novel = recommendWorkshop('Schedule shared telescopes fairly for volunteer teams.');
  assert.equal(novel.state, 'none');
  assert.equal(novel.guides.length, 0);
  assert.equal(novel.gaps.length, 1);
  const volunteer = recommendWorkshop('Schedule shared telescopes fairly across volunteer teams.');
  assert.ok(!volunteer.requirements.some(r => r.id === 'integration'));
  assert.ok(!inferRequirementsFromSelections([], 'Schedule telescopes for volunteer teams.').includes('m365-graph'));
  assert.ok(inferRequirementsFromSelections([], 'Use Microsoft Teams channels.').includes('m365-graph'));
  assert.match(volunteer.gaps[0].label, /Schedule shared telescopes/);
  const schedulingIntegration = recommendWorkshop('Schedule shared telescopes via a Microsoft Teams integration.');
  assert.ok(schedulingIntegration.gaps.some(r => r.id === 'integration'));
  assert.ok(schedulingIntegration.gaps.some(r => r.label.includes('Schedule shared telescopes')));
  for (const text of ['', 'Help me', 'Build an AI']) {
    assert.equal(recommendWorkshop(text).state, 'clarification');
    assert.equal(recommendWorkshop(text).guides.length, 0);
  }
});
test('multi-step work alone does not imply multi-agent orchestration', () => {
  const result = recommendWorkshop('Automate a multi-step business process for appointment scheduling.');
  assert.ok(!result.guides.some(g => g.playbook.slug === 'multi-agent-orchestration'));
  assert.ok(recommendWorkshop('Coordinate heterogeneous agents with typed hand-offs for a launch.').guides.some(g => g.playbook.slug === 'multi-agent-orchestration'));
});
test('unsupported requests and deployment constraints are explicit', () => {
  assert.equal(recommendWorkshop('Use an unsupported connector that bypass access permissions.').state, 'unsupported');
  assert.equal(recommendWorkshop('Use an unsupported integration to the legacy scheduling system.').state, 'unsupported');
  assert.equal(recommendWorkshop(`${hr} Require an air-gapped runtime.`).state, 'partial');
});
test('all original playbook slugs and decks remain, with explicit roles and suitability', () => {
  assert.deepEqual(playbooks.map(p => p.slug), [
    'getting-started', 'enterprise-knowledge-grounding', 'multi-agent-orchestration',
    'governance-safety-baseline', 'continuous-evaluation-loop', 'voice-first-agent-blueprint',
    'bring-your-own-skills', 'threadlight-pipeline', 'citadel-governance-hub',
  ]);
  for (const p of playbooks) {
    assert.ok(existsSync(`playbooks/${p.slug}/README.md`));
    assert.ok(p.role && p.prerequisites.length && p.exclusions.length && p.adaptation);
  }
});

const request = {
  brief: 'Schedule shared telescopes for volunteers.',
  gaps: [{ id: 'schedule', label: 'Fair scheduling', evidence: 'schedule' }],
  coveredRequirementIds: ['knowledge-grounding'],
};
const proposal = {
  suggestions: [{ kind: 'patterns', source: 'catalog', id: 'workflow', label: 'Candidate workflow', reason: 'Review fairness rules', addresses: ['schedule'] }],
  guideIds: [], questions: ['What are the fairness rules?'], uncertainties: ['No integration validated.'], unsupported: [],
};
test('typed AI contracts reject fabricated IDs, extra fields and covered regeneration', () => {
  assert.equal(validateAIProposal(proposal, request).suggestions[0].id, 'workflow');
  assert.throws(() => validateAIProposal({ ...proposal, guideIds: ['fake-playbook'] }, request), /Fabricated/);
  assert.throws(() => validateAIProposal({ ...proposal, guideIds: ['getting-started'] }, request), /unsuitable/);
  assert.throws(() => validateAIProposal({ ...proposal, suggestions: [{ ...proposal.suggestions[0], id: 'magic-workflow' }] }, request), /Fabricated/);
  assert.throws(() => validateAIProposal({ ...proposal, suggestions: [{ ...proposal.suggestions[0], addresses: ['knowledge-grounding'] }] }, request), /only requested gaps/);
  assert.throws(() => validateAIProposal({ ...proposal, tools: ['bash'] }, request), /Unexpected/);
  assert.throws(() => validateAIProposal({ ...proposal, suggestions: [{ ...proposal.suggestions[0], source: 'custom', kind: 'toString', id: 'custom-invalid' }] }, request), /Unknown suggestion kind/);
  assert.throws(() => validateAIProposal({ ...proposal, suggestions: [{ ...proposal.suggestions[0], source: 'custom', id: 'scheduler' }] }, request), /namespaced/);
});
test('custom proposals remain distinct and request validation is fail-closed', () => {
  const custom = validateAIProposal({ ...proposal, suggestions: [{ ...proposal.suggestions[0], source: 'custom', id: 'custom-scheduler' }] }, request);
  assert.equal(custom.suggestions[0].source, 'custom');
  assert.throws(() => validateAnalysisRequest({ ...request, coveredRequirementIds: ['schedule'] }), /Covered/);
  assert.throws(() => validateAnalysisRequest({ ...request, gaps: [] }), /uncovered/);
  assert.throws(() => validateAnalysisRequest({ ...request, brief: '' }), /nonempty/);
  assert.throws(() => validateAnalysisRequest({ ...request, gaps: [request.gaps[0], request.gaps[0]] }), /Duplicate/);
});
test('manually authored technical selections remain explicit uncovered requirements', () => {
  const result = recommendWorkshop(hr, [], ['Custom HR adapter']);
  assert.equal(result.state, 'partial');
  assert.equal(result.gaps[0].label, 'Custom HR adapter');
  assert.equal(result.guides[0].playbook.slug, 'enterprise-knowledge-grounding');
});

const spec: WorkshopSpec = {
  brief: hr, outcome: 'Answer the customer HR policies with cited evidence', users: 'HR staff',
  inScope: ['Policy Q&A'], outOfScope: ['Production rollout', 'Payroll writes'],
  constraints: ['EU data residency', 'Approved sample documents only'],
  assumptions: ['Corpus owner supplies approved samples'], successCriteria: ['Every supported answer cites a source'],
  evidence: ['20 policy/refusal cases and access-boundary results'],
  capabilities: ['Foundry IQ'], buildingBlocks: ['Identity & Access', 'Observability'],
  candidatePatterns: ['Knowledge Grounding'], execution: 'agentic-loop',
  guides: [{ slug: 'enterprise-knowledge-grounding', reason: 'Citations required by the brief' }],
  acceptedSuggestions: [], gaps: [], openQuestions: [], resolutions: '',
};
test('approval snapshots invalidate when any upstream source of truth changes', () => {
  const approved = formatWorkshopSpec(spec);
  assert.ok(approvalIsCurrent(spec, approved));
  assert.ok(canApproveSpec(spec));
  for (const changed of [
    { ...spec, brief: 'A different brief' }, { ...spec, constraints: ['Different residency'] },
    { ...spec, successCriteria: ['Different criterion'] }, { ...spec, candidatePatterns: ['Workflow Automation'] },
  ]) assert.ok(!approvalIsCurrent(changed, approved));
  assert.ok(!canApproveSpec({ ...spec, users: '' }));
  assert.ok(!canApproveSpec({ ...spec, openQuestions: ['Unresolved access?'] }));
});
test('full approved scope, selections, criteria and constraints survive the copied build prompt', () => {
  const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: spec });
  assert.ok(result.copilotPrompt.includes(formatWorkshopSpec(spec)));
  assert.ok(result.copilotPrompt.startsWith(`/spec2cloud ${hr}`));
  assert.deepEqual(result.playbooks.map(p => p.slug), spec.guides.map(g => g.slug));
  assert.ok(!result.copilotPrompt.includes('Weather'));
  assert.match(result.copilotPrompt, /not production-ready/);
  const threadlight = buildAdvisorPackage({
    path: 'idea', intent: hr, requirementIds: [],
    workshopSpec: { ...spec, execution: 'threadlight-pipeline' },
  });
  assert.match(threadlight.copilotPrompt, /^Use the threadlight-design skill/);
});
