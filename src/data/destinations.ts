// Single source of truth for the destinations the Home "Start here" router,
// the sidebar, and scenario pages send people to.

/**
 * Curated Astra industry demos. Override with VITE_ASTRA_DEMOS_URL once the
 * demos are mounted behind Front Door (e.g. `/astra`), the same way Kratos is.
 */
export const ASTRA_DEMOS_URL =
  (import.meta.env.VITE_ASTRA_DEMOS_URL as string | undefined) ??
  'https://astra-demo.icyground-ce9cbed9.westeurope.azurecontainerapps.io/';

export interface AstraDemo {
  id: string;
  name: string;
  industry: string;
  summary: string;
  /** Scenario ids (src/data/scenarios.json) that this demo brings to life. */
  scenarioIds: string[];
}

/** The curated demos available in the Astra demo library. */
export const ASTRA_DEMOS: AstraDemo[] = [
  {
    id: 'relationship-management',
    name: 'Relationship management',
    industry: 'Financial Services: Banking',
    summary: 'A market event hits six client portfolios. The agent ranks who to call first and drafts review-only outreach.',
    scenarioIds: ['empower-relationship-managers-with-ai'],
  },
  {
    id: 'adaptive-lending',
    name: 'Adaptive lending',
    industry: 'Financial Services: Banking',
    summary: 'Four specialist agents review a loan file, re-plan as documents arrive, and stop at a human credit decision.',
    scenarioIds: ['modernize-lending-and-mortgage-processes-with-ai'],
  },
  {
    id: 'supply-chain-disruption',
    name: 'Supply-chain disruption response',
    industry: 'Manufacturing',
    summary: 'A supplier goes down. The agent compares constrained recovery allocations and explains the trade-offs.',
    scenarioIds: ['transform-factory-operations-with-ai'],
  },
];

/** The Astra demo that brings a given industry scenario to life, if any. */
export function astraDemoForScenario(scenarioId: string): AstraDemo | undefined {
  return ASTRA_DEMOS.find(d => d.scenarioIds.includes(scenarioId));
}
