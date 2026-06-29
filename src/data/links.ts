import scenariosData from './scenarios.json';
import playbooksData from './playbooks.json';

export interface Scenario {
  id: string;
  name: string;
  industry: string;
  description: string;
  image: string;
  tags: string[];
  prompt?: string;
  capabilities?: string[];
  buildingBlocks?: string[];
  patterns?: string[];
  videoFileName?: string;
  link?: string;
}

export interface Playbook {
  slug: string;
  name: string;
  icon: string;
  level: string;
  summary: string;
  use_when: string;
  patterns: string[];
  capabilities?: string[];
  building_blocks?: string[];
  buildSkills?: string[];
  runSkills?: string[];
}

export const scenarios = scenariosData as Scenario[];
export const playbooks = playbooksData as Playbook[];

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

/** Playbooks whose tags intersect a scenario's tags (wildcard playbooks always included). */
export function playbooksForScenario(scenario: Scenario): Playbook[] {
  const tags = new Set(scenario.tags);
  return playbooks.filter(p =>
    p.patterns.includes('*') || playbookMatchTags(p).some(t => tags.has(t))
  );
}

/** Scenarios that exercise a given playbook (wildcard playbooks match all). */
export function scenariosForPlaybook(playbook: Playbook, limit?: number): Scenario[] {
  if (playbook.patterns.includes('*')) {
    return typeof limit === 'number' ? scenarios.slice(0, limit) : scenarios;
  }
  const tags = new Set(playbookMatchTags(playbook));
  const matches = scenarios.filter(s => s.tags.some(t => tags.has(t)));
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}
