import { scenarios, type Playbook, type Scenario } from './catalog';
import { recommendWorkshop } from './workshop';
export { scenarios, playbooks, type Playbook, type Scenario } from './catalog';

/** Slugs of playbooks that ship a rendered README (and are therefore clickable). */
const PLAYBOOK_DECKS = new Set(
  Object.keys(import.meta.glob('/playbooks/*/README.md')).map(
    path => path.split('/')[2],
  ),
);

/** A playbook is interactive when it ships a `playbooks/<slug>/README.md`. */
export function playbookHasDeck(slug: string): boolean {
  return PLAYBOOK_DECKS.has(slug);
}

/** All matchable tags for a playbook: patterns + capabilities + building blocks (the '*' wildcard excluded). */
export function playbookMatchTags(p: Playbook): string[] {
  return [...(p.patterns ?? []), ...(p.capabilities ?? []), ...(p.building_blocks ?? [])]
    .filter(t => t !== '*');
}

/** Scenario guidance uses the same evidence/coverage model as the workshop. */
export function playbooksForScenario(scenario: Scenario): Playbook[] {
  return recommendWorkshop(`${scenario.description} ${scenario.prompt ?? ''}`).guides.map(g => g.playbook);
}

/** Backlinks reflect documented suitability, not wildcard eligibility. */
export function scenariosForPlaybook(playbook: Playbook, limit?: number): Scenario[] {
  const matches = scenarios.filter(s => playbooksForScenario(s).some(p => p.slug === playbook.slug));
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}
