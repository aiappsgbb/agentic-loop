import scenariosData from './scenarios.json';
import playbooksData from './playbooks.json';

export interface Scenario {
  id: string;
  name: string;
  industry: string;
  description: string;
  image: string;
  tags: string[];
  link?: string;
}

export interface Playbook {
  slug: string;
  name: string;
  icon: string;
  level: string;
  steps: number;
  summary: string;
  use_when: string;
  techniques: string[];
  buildSkills?: string[];
  deploymentSkills?: string[];
}

export const scenarios = scenariosData as Scenario[];
export const playbooks = playbooksData as Playbook[];

/** Slugs that ship a rendered slide deck (any playbooks/<slug>/README.md). */
const DECK_SLUGS = new Set(
  Object.keys(
    import.meta.glob('/playbooks/*/README.md', { eager: true }),
  ).map(path => path.split('/')[2]),
);

/** Whether a playbook ships a rendered slide deck. */
export function playbookHasDeck(slug: string): boolean {
  return DECK_SLUGS.has(slug);
}

/** Playbooks whose techniques intersect a scenario's tags (getting-started always included). */
export function playbooksForScenario(scenario: Scenario): Playbook[] {
  const tags = new Set(scenario.tags);
  return playbooks.filter(p =>
    p.techniques.includes('*') || p.techniques.some(t => tags.has(t))
  );
}

/** Scenarios that exercise a given playbook's techniques. */
export function scenariosForPlaybook(playbook: Playbook, limit?: number): Scenario[] {
  if (playbook.techniques.includes('*')) {
    return typeof limit === 'number' ? scenarios.slice(0, limit) : scenarios;
  }
  const techniques = new Set(playbook.techniques);
  const matches = scenarios.filter(s => s.tags.some(t => techniques.has(t)));
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}
