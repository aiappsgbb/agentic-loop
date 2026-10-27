import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { playbooks } from '../src/data/catalog';
import {
  recommendWorkshop,
  approvalIsCurrent, formatWorkshopSpec, formatWorkshopSpecMarkdown, canApproveSpec, type WorkshopSpec,
  withRequiredCapabilities,
} from '../src/data/workshop';
import { buildAdvisorPackage, inferRequirementsFromSelections } from '../src/data/advisor';
import workshopBriefs from '../src/data/workshop-briefs.json';
import { newWorkshopDraft } from '../src/components/WorkshopContext';
import { FOUNDRY_LOOP } from '../src/data/buildWorkflow';
import { getBuildSkill, skillInstallCommand, skillRawUrl, skillRepoUrl } from '../src/data/skills';

const hr = 'Employees need HR policy answers grounded in approved documents with citations.';
test('production hosting serves playbook deep links through the SPA fallback', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8'));
  assert.equal(config.navigationFallback.rewrite, '/index.html');
  assert.ok(!config.navigationFallback.exclude.includes('/playbooks/*'));
  assert.ok(config.navigationFallback.exclude.includes('/assets/*'));
  assert.ok(config.navigationFallback.exclude.includes('/images/*'));
  assert.ok(config.navigationFallback.exclude.some((pattern: string) => pattern.includes('css,js')));
});
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

test('curated workshop preparation is deterministic for the same brief and selections', () => {
  const selections = ['frontier-models', 'knowledge', 'identity', 'observability'];
  assert.deepEqual(recommendWorkshop(hr, selections), recommendWorkshop(hr, selections));
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
  gaps: [], openQuestions: [], resolutions: '',
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
  assert.ok(!canApproveSpec({ ...spec, gaps: ['Customer integration'] }));
  assert.ok(canApproveSpec({ ...spec, gaps: ['Customer integration'], resolutions: 'Use approved sample data; exclude the live integration.' }));
});
test('full approved scope, selections, criteria and constraints survive the copied build prompt', () => {
  const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: spec });
  assert.ok(result.copilotPrompt.includes(formatWorkshopSpecMarkdown(spec)));
  assert.ok(!result.copilotPrompt.includes(formatWorkshopSpec(spec)));
  assert.ok(!result.copilotPrompt.includes('GitHub Copilot App'));
  assert.ok(result.copilotPrompt.startsWith('Use the foundry-agentic-loop skill to build the pilot described in the confirmed specification below.\n\n## Foundry Agentic Loop build contract'));
  assert.deepEqual(result.playbooks.map(p => p.slug), spec.guides.map(g => g.slug));
  assert.ok(!result.copilotPrompt.includes('Weather'));
  assert.match(result.copilotPrompt, /not production-ready/);
  const threadlight = buildAdvisorPackage({
    path: 'idea', intent: hr, requirementIds: [],
    workshopSpec: { ...spec, execution: 'threadlight-pipeline' },
  });
  assert.match(threadlight.copilotPrompt, /^Use the threadlight-design skill/);
});
test('Markdown specification preserves every customer decision without JSON', () => {
  const complete = {
    ...spec, gaps: ['Customer API contract'], openQuestions: ['Who owns the API?'],
    resolutions: 'Customer owns the API.\nUse read-only sample responses.',
  };
  const markdown = formatWorkshopSpecMarkdown(complete);
  for (const value of Object.values(complete)) {
    if (typeof value === 'string' && value !== complete.execution) assert.ok(markdown.includes(value));
    if (Array.isArray(value)) for (const item of value) {
      if (typeof item === 'string') assert.ok(markdown.includes(item));
      else {
        assert.ok(markdown.includes(item.slug));
        assert.ok(markdown.includes(item.reason));
      }
    }
  }
  assert.match(markdown, /### Build workflow\n\nFoundry Agentic Loop — SDD/);
  assert.match(markdown, /### Success criteria\n\n- Every supported answer cites a source/);
  assert.match(formatWorkshopSpecMarkdown(spec), /### Remaining gaps\n\n- None specified\./);
  assert.match(formatWorkshopSpecMarkdown({ ...spec, execution: 'threadlight-pipeline' }), /### Build workflow\n\nThreadlight pipeline/);
  assert.ok(!markdown.includes('"brief":'));
});
test('build prompts include the customer brief only once for both workflows', () => {
  for (const execution of ['agentic-loop', 'agentic-loop-rapid', 'threadlight-pipeline'] as const) {
    for (const workshopSpec of [
      { ...spec, execution },
      { ...spec, execution, outcome: hr, inScope: [hr], gaps: [hr], resolutions: 'Use a manual pilot.' },
    ]) {
      const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec });
      assert.equal(result.copilotPrompt.split(hr).length - 1, 1);
      assert.ok(!result.copilotPrompt.includes('GitHub Copilot App'));
      assert.ok(result.copilotPrompt.includes(`### Customer brief\n\n${hr}`));
      assert.ok(result.copilotPrompt.includes(formatWorkshopSpecMarkdown(workshopSpec)));
    }
  }
  const markdown = formatWorkshopSpecMarkdown({ ...spec, outcome: hr, inScope: [hr] });
  assert.match(markdown, /### Expected outcome\n\nSee Customer brief\./);
  assert.match(markdown, /### In scope\n\n- See Customer brief\./);
});
test('build prompts contain execution instructions, not App setup directions', () => {
  const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [] });
  assert.ok(result.copilotPrompt.startsWith(`Use the foundry-agentic-loop skill in SDD mode. Build: ${hr}\n\n## Foundry Agentic Loop build contract`));
  assert.ok(!result.copilotPrompt.includes('GitHub Copilot App'));
});
test('playbooks retain teaching context and repeatable customer-specific build guidance', () => {
  for (const execution of ['agentic-loop', 'threadlight-pipeline'] as const) {
    const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: { ...spec, execution } });
    assert.match(result.copilotPrompt, /## Learn while building/);
    assert.match(result.copilotPrompt, /Solution Engineer can teach the customer/);
    assert.match(result.copilotPrompt, /Platform focus: Foundry IQ; Agentic Retrieval; Storage/);
    assert.match(result.copilotPrompt, /connect each chosen platform capability to a confirmed customer requirement/);
    assert.match(result.copilotPrompt, /without repeating every tutorial step/);
    assert.match(result.copilotPrompt, /Preserve scope and permission reviews on every build/);
    assert.ok(!result.copilotPrompt.includes('getting-started'));
  }
  const custom = buildAdvisorPackage({ path: 'idea', intent: 'Schedule telescopes fairly.', requirementIds: [], workshopSpec: { ...spec, guides: [] } });
  assert.match(custom.copilotPrompt, /No maintained playbook covers this scope/);
  assert.match(custom.copilotPrompt, /do not substitute an unrelated tutorial/);
  assert.ok(!custom.copilotPrompt.includes('Platform focus:'));
  assert.ok(!custom.copilotPrompt.includes('Weather'));
});
test('all workshop paths use the bundled skill and preserve readiness safeguards', () => {
  const gettingStarted = readFileSync(new URL('../playbooks/getting-started/README.md', import.meta.url), 'utf8');
  const invocationContract = [
    'Run the skill-owned read-only RBAC and placement preflight before creating resources.',
    'Report all permission gaps together and stop on BLOCKED or ERROR; do not grant permissions to bypass this gate.',
    'Confirm billable changes before making them.',
  ];
  const packages = [
    buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: spec }),
    buildAdvisorPackage({ path: 'scenario', intent: hr, requirementIds: [], workshopSpec: spec }),
    buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: { ...spec, execution: 'agentic-loop-rapid' } }),
    buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: { ...spec, execution: 'threadlight-pipeline' } }),
    buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [] }),
    buildAdvisorPackage({ path: 'scenario', intent: hr, requirementIds: [] }),
  ];
  for (const sentence of invocationContract) {
    assert.ok(gettingStarted.includes(sentence));
    for (const result of packages) assert.equal(result.copilotPrompt.split(sentence).length - 1, 1);
  }
  for (const result of packages) {
    assert.match(result.copilotPrompt, /Invoke the installed foundry-agentic-loop skill/);
    assert.ok(!result.copilotPrompt.includes('before Plan starts'));
    assert.ok(result.buildSkills.includes('foundry-agentic-loop'));
    assert.ok(result.buildSkills.includes('microsoft-foundry'));
    assert.ok(!result.buildSkills.includes('agentic-loop'));
    assert.match(result.copilotPrompt, /Add complementary services only when the confirmed scope needs them/);
    assert.ok(!result.copilotPrompt.includes('GitHub Copilot App'));
    if (result.workshopSpec) {
      assert.ok(result.copilotPrompt.indexOf('## Foundry Agentic Loop build contract') <
        result.copilotPrompt.indexOf('## Confirmed customer workshop specification'));
    }
  }
});
test('SDD folds planning into Specify and retains review, approval and resume gates', () => {
  const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: spec });
  assert.match(result.copilotPrompt, /foundry-agentic-loop-workflow: Specify → Implement → Verify → Deploy/);
  assert.match(result.copilotPrompt, /Planning is part of Specify, not a separate Plan phase/);
  assert.match(result.copilotPrompt, /Require spec approval and always pause before azd up/);
  assert.match(result.copilotPrompt, /portal scope confirmation is not deployment approval/);
  assert.match(result.copilotPrompt, /independent fresh-context reviewer/);
  assert.match(result.copilotPrompt, /bounded fix rounds/);
  assert.match(result.copilotPrompt, /Resume journaled work/);
  assert.match(result.copilotPrompt, /\.agentic-loop\/runs\//);
  assert.equal(result.deploymentCommand, 'azd up');
});
test('Rapid preserves the existing-project requirement without running SDD', () => {
  const rapidSpec: WorkshopSpec = { ...spec, execution: 'agentic-loop-rapid' };
  const result = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: rapidSpec });
  assert.match(result.copilotPrompt, /Rapid prototyping in an existing Foundry project/);
  assert.match(result.copilotPrompt, /Ask for the project if none is established/);
  assert.match(result.copilotPrompt, /never substitute a saved suggestion without approval/);
  assert.match(result.copilotPrompt, /separate, explicitly approved action using az containerapp up/);
  assert.ok(!result.copilotPrompt.includes('SDD with foundry-agentic-loop-workflow'));
  assert.equal(result.deploymentCommand, 'az containerapp up');
  assert.ok(!approvalIsCurrent(rapidSpec, formatWorkshopSpec(spec)));
  assert.match(formatWorkshopSpecMarkdown(rapidSpec), /Foundry Agentic Loop — Rapid prototyping/);
});
test('Threadlight remains an explicit alternate delivery workflow', () => {
  const result = buildAdvisorPackage({
    path: 'idea', intent: hr, requirementIds: [], workshopSpec: { ...spec, execution: 'threadlight-pipeline' },
  });
  assert.match(result.copilotPrompt, /^Use the threadlight-design skill/);
  assert.match(result.copilotPrompt, /do not start the SDD workflow or replace the selected delivery workflow/);
  assert.ok(!result.copilotPrompt.includes('SDD with foundry-agentic-loop-workflow'));
});
test('published skill links follow upstream main and install the whole plugin', () => {
  const skill = getBuildSkill('foundry-agentic-loop')!;
  assert.equal(skill.repo, 'github/awesome-copilot');
  assert.equal(skillInstallCommand(skill), FOUNDRY_LOOP.installCommand);
  assert.equal(skillRepoUrl(skill), 'https://github.com/github/awesome-copilot/tree/main/skills/foundry-agentic-loop');
  assert.equal(skillRawUrl(skill), 'https://raw.githubusercontent.com/github/awesome-copilot/main/skills/foundry-agentic-loop/SKILL.md');
  assert.ok(getBuildSkill('agentic-loop'), 'Legacy skill route remains supported');
  const catalog = readFileSync('skills/agentic-loop/references/build-skills-catalog.md', 'utf8');
  assert.match(catalog, /`github\/awesome-copilot`\s+\| `foundry-agentic-loop`/);
  for (const guide of playbooks.filter(p => p.buildSkills?.includes('foundry-agentic-loop'))) {
    const content = readFileSync(`playbooks/${guide.slug}/README.md`, 'utf8');
    assert.ok(!guide.buildSkills?.includes('agentic-loop'));
    assert.match(content, /copilot plugin install foundry-agentic-loop@awesome-copilot/);
    assert.match(content, /https:\/\/github.com\/github\/awesome-copilot\/tree\/main\/plugins\/foundry-agentic-loop/);
    assert.doesNotMatch(content, /once published|publication pending|currently (?:an? )?open|Preview availability/i);
    assert.match(content, /Without the canvas, continue in Chat; without the workflow, SDD cannot start/);
    assert.doesNotMatch(content, /required extensions are missing, disabled or unavailable, stop/);
    assert.ok(!content.includes('/spec2cloud'));
    assert.ok(!content.includes('lean@Spec2Cloud'));
    assert.ok(!content.includes('Spec2Cloud canvas'));
    assert.ok(!content.includes('/plan'));
  }
});
test('published recovery guidance preserves consent and the selected mode', () => {
  for (const execution of ['agentic-loop', 'agentic-loop-rapid', 'threadlight-pipeline'] as const) {
    const { copilotPrompt } = buildAdvisorPackage({ path: 'idea', intent: hr, requirementIds: [], workshopSpec: { ...spec, execution } });
    assert.match(copilotPrompt, /Ask before reinstalling the plugin/);
    assert.match(copilotPrompt, /never install extensions from a URL or edit Copilot settings/);
    assert.match(copilotPrompt, /Without the canvas, continue in Chat; without the workflow, SDD cannot start/);
    assert.match(copilotPrompt, /Offer Rapid only with user confirmation and an existing Foundry project/);
  }
});
