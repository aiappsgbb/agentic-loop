import { createContext } from 'react';
import { withRequiredCapabilities } from '../data/workshop';
import workshopBriefs from '../data/workshop-briefs.json';

export interface WorkshopDraft {
  brief: string;
  capabilities: string[];
  buildingBlocks: string[];
  patterns: string[];
  customCapabilities: string;
  customBlocks: string;
  customPatterns: string;
  outcome: string;
  users: string;
  inScope: string;
  outOfScope: string;
  constraints: string;
  assumptions: string;
  criteria: string;
  evidence: string;
  questions: string;
  resolutions: string;
  execution: 'agentic-loop' | 'threadlight-pipeline';
  manualGuideIds: string[];
  removedGuideIds: string[];
  approved: string | null;
  prepared: boolean;
}
export function newWorkshopDraft(brief = ''): WorkshopDraft {
  const sampleIndex = workshopBriefs.indexOf(brief);
  const groundedSample = sampleIndex === 0 || sampleIndex === 1;
  return {
    brief,
    capabilities: withRequiredCapabilities(groundedSample ? ['knowledge'] : []),
    buildingBlocks: ['identity', 'observability'],
    patterns: groundedSample ? ['knowledge-grounding'] : sampleIndex === 2 ? ['human-in-the-loop'] : [],
    customCapabilities: '', customBlocks: '', customPatterns: '',
    outcome: '', users: '', inScope: '', outOfScope: 'Production rollout and production-readiness certification',
    constraints: 'Use approved sample data. Enforce authorized access and least-privilege identity. Minimize sensitive data.',
    assumptions: '', criteria: '', evidence: 'Scenario tests, access/refusal tests and failure-path results',
    questions: '', resolutions: '', execution: 'agentic-loop',
    manualGuideIds: [], removedGuideIds: [], approved: null, prepared: false,
  };
}
export const WorkshopContext = createContext<{
  drafts: Record<string, WorkshopDraft>;
  update: (key: string, draft: WorkshopDraft) => void;
}>({ drafts: {}, update: () => { throw new Error('WorkshopProvider is required.'); } });
