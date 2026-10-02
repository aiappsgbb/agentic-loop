import { createContext } from 'react';
import type { AIProposal } from '../data/workshop';

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
  proposal: AIProposal | null;
  acceptedIds: string[];
  approved: string | null;
  prepared: boolean;
}
export function newWorkshopDraft(brief = ''): WorkshopDraft {
  return {
    brief, capabilities: [], buildingBlocks: ['identity', 'observability'], patterns: [],
    customCapabilities: '', customBlocks: '', customPatterns: '',
    outcome: '', users: '', inScope: '', outOfScope: 'Production rollout and production-readiness certification',
    constraints: 'Use approved sample data. Enforce authorized access and least-privilege identity. Minimize sensitive data.',
    assumptions: '', criteria: '', evidence: 'Scenario tests, access/refusal tests and failure-path results',
    questions: '', resolutions: '', execution: 'agentic-loop',
    manualGuideIds: [], removedGuideIds: [], proposal: null, acceptedIds: [], approved: null, prepared: false,
  };
}
export const WorkshopContext = createContext<{
  drafts: Record<string, WorkshopDraft>;
  update: (key: string, draft: WorkshopDraft) => void;
}>({ drafts: {}, update: () => { throw new Error('WorkshopProvider is required.'); } });
