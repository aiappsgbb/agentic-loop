import playbooksData from './playbooks.json';
import scenariosData from './scenarios.json';

export type PlaybookRole = 'onboarding' | 'capability' | 'workflow' | 'operations' | 'infrastructure';
export const ROLE_LABELS: Record<PlaybookRole, string> = {
  onboarding: 'Learn the workflow',
  capability: 'Capability guide',
  workflow: 'Delivery workflow',
  operations: 'Governance and operations',
  infrastructure: 'Shared infrastructure',
};

export interface Playbook {
  slug: string;
  name: string;
  icon: string;
  level: string;
  accelerator?: boolean;
  summary: string;
  use_when: string;
  patterns: string[];
  capabilities?: string[];
  building_blocks?: string[];
  buildSkills?: string[];
  runSkills?: string[];
  role: PlaybookRole;
  addresses: string[];
  prerequisites: string[];
  exclusions: string[];
  adaptation: string;
}

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
  runSkills?: string[];
  video?: string;
  link?: string;
}

export const playbooks: Playbook[] = playbooksData as Playbook[];
export const scenarios: Scenario[] = scenariosData;
