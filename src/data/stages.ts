import { Presentation, Hammer, ShieldCheck, type LucideIcon } from 'lucide-react';
import { ASTRA_DEMOS_URL } from './destinations';

export type StageId = 'showcase' | 'build' | 'productionise';

export interface StageDestination {
  label: string;
  desc: string;
  to: string;
  external?: boolean;
  badge?: string;
}

export interface Stage {
  id: StageId;
  step: string;
  name: string;
  route: string;
  icon: LucideIcon;
  /** Who this stage is for. */
  audience: string;
  /** One-line promise, shown as the stage headline. */
  headline: string;
  /** What you walk away with. */
  outcome: string;
  /** Boundary statement: what this stage does not give you. */
  boundary: string;
  primary: StageDestination;
  destinations: StageDestination[];
}

export const STAGES: Stage[] = [
  {
    id: 'showcase',
    step: '01',
    name: 'Showcase',
    route: '/showcase',
    icon: Presentation,
    audience: 'Sellers · SSP / AE',
    headline: 'Put a working agent in front of a customer today.',
    outcome: 'A customer conversation grounded in a real, running industry demo. No code, no setup.',
    boundary: 'Demos run on synthetic data. They are for showing, not for deploying.',
    primary: { label: 'Open the Astra demos', to: ASTRA_DEMOS_URL, external: true, desc: '' },
    destinations: [
      {
        label: 'Astra industry demos',
        desc: 'Relationship management, adaptive lending and supply-chain disruption, running live on Foundry.',
        to: ASTRA_DEMOS_URL,
        external: true,
        badge: 'Live',
      },
      {
        label: 'Kratos personas',
        desc: 'Open a prebuilt insurance, banking or wealth agent and chat with it.',
        to: '/reference/kratos',
      },
      {
        label: 'Scenario demos',
        desc: 'Industry scenarios with a recorded or live demo to share.',
        to: '/scenarios',
      },
    ],
  },
  {
    id: 'build',
    step: '02',
    name: 'Build',
    route: '/build',
    icon: Hammer,
    audience: 'Solution engineers · Builders',
    headline: 'Build a custom agent with GitHub Copilot.',
    outcome: 'A working agent on Microsoft Foundry in your subscription, with code you own.',
    boundary: 'Built for pilots and workshops. Add the Productionise controls before real users rely on it.',
    primary: { label: 'Start with Getting started', to: '/playbooks/getting-started', desc: '' },
    destinations: [
      {
        label: 'Getting started',
        desc: 'Your first agent: Copilot builds a simple agent and runs it as a Foundry hosted agent.',
        to: '/playbooks/getting-started',
        badge: 'Start here',
      },
      {
        label: 'Agentic Launchpad',
        desc: 'Turn your own idea into a spec and a Copilot-ready prompt.',
        to: '/build#prompt',
      },
      {
        label: 'Industry scenarios',
        desc: '61 prompt-ready use cases, each mapped to the patterns behind it.',
        to: '/scenarios',
      },
      {
        label: 'Capability playbooks',
        desc: 'Grounding, multi-agent orchestration, voice and custom skills, step by step.',
        to: '/playbooks?stage=build',
      },
      {
        label: 'Skills catalog',
        desc: 'Every Build and Run skill Copilot can use.',
        to: '/skills',
      },
    ],
  },
  {
    id: 'productionise',
    step: '03',
    name: 'Productionise',
    route: '/productionise',
    icon: ShieldCheck,
    audience: 'Customers · Delivery teams · Architects',
    headline: 'Take it to production, governed and evaluated.',
    outcome: 'An agent in the customer tenant with identity, governance, evals, red-teaming and observability, deployed with azd up.',
    boundary: 'This is where production decisions live. Showcase demos never skip this stage.',
    primary: { label: 'Open Kratos', to: '/reference/kratos', desc: '' },
    destinations: [
      {
        label: 'Kratos',
        desc: 'Fork a production-shaped app: Entra sign-in, Cosmos DB, tracing, one-command deploy.',
        to: '/reference/kratos',
        badge: 'Template',
      },
      {
        label: 'Idea to production',
        desc: 'The Threadlight pipeline: governance, evals, red-team, cost model and compliance pack in one run.',
        to: '/playbooks/threadlight-pipeline',
      },
      {
        label: 'Citadel governance hub',
        desc: 'A governed APIM AI gateway: keyless, attributed, policy-governed model access for every agent.',
        to: '/playbooks/citadel-governance-hub',
      },
      {
        label: 'Governance & safety baseline',
        desc: 'Policy boundaries, safety controls and red-team gates on a real agent.',
        to: '/playbooks/governance-safety-baseline',
      },
      {
        label: 'Continuous evaluation',
        desc: 'Evaluate continuously and trace regressions back to governed skill versions.',
        to: '/playbooks/continuous-evaluation-loop',
      },
      {
        label: 'Reference architecture',
        desc: 'The Foundry and Azure landing zone every stage deploys into.',
        to: '/concepts/platform',
      },
    ],
  },
];

export function getStage(id: StageId): Stage {
  return STAGES.find(s => s.id === id)!;
}

/** Stage each playbook belongs to. Playbooks not listed default to Build. */
export const PLAYBOOK_STAGE: Record<string, StageId> = {
  'governance-safety-baseline': 'productionise',
  'continuous-evaluation-loop': 'productionise',
  'threadlight-pipeline': 'productionise',
  'citadel-governance-hub': 'productionise',
};

export function playbookStage(slug: string): StageId {
  return PLAYBOOK_STAGE[slug] ?? 'build';
}
