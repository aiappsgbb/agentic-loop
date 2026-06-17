// Threadlight-compatible persona manifest builder.
//
// Produces a PersonaManifest whose shape mirrors the Kratos import contract
// (src/backend/app/models.py :: PersonaManifest) field-for-field, and is
// compatible with the threadlight-design skill's specs/manifest.json persona
// shape. Kratos imports this deterministically (no LLM on the main path) and
// maps it onto its three persona files.
//
// The mapping is intentionally deterministic: a natural-language description
// (plus optional advisor selections) is run through the existing
// `inferRequirementsFromSelections` heuristic, and each detected requirement
// contributes skills / MCP servers / traits via the table below.

import {
  inferRequirementsFromSelections,
  requirementsByIds,
  type AdvisorRequirementId,
} from './advisor';

export interface PersonaSkill {
  name: string;
  description?: string;
  package?: string;
  implements?: string[];
}

export interface PersonaMcpServer {
  name: string;
  transport?: 'http' | 'sse' | 'stdio';
  url?: string;
  registry?: boolean;
}

export interface PersonaManifest {
  name: string;
  description?: string;
  instructions?: string;
  displayName?: string;
  sampleQuestions?: string[];
  skills?: PersonaSkill[];
  mcpServers?: PersonaMcpServer[];
  traits?: string[];
  workflow_model?: 'agent' | 'workflow';
}

interface RequirementContribution {
  skills?: Omit<PersonaSkill, 'implements'>[];
  mcpServers?: PersonaMcpServer[];
  traits?: string[];
}

// requirement id -> persona contributions (skills / MCP servers / traits).
// Platform-only requirements (observability, identity, networking, gateway,
// container, api) contribute a trait for traceability but no runtime skill.
const REQUIREMENT_CONTRIBUTIONS: Record<AdvisorRequirementId, RequirementContribution> = {
  'web-search': {
    skills: [{ name: 'web-search', description: 'Search the public web for current information and cite sources.' }],
    traits: ['web-search'],
  },
  'knowledge-grounding': {
    skills: [{ name: 'knowledge-retrieval', description: 'Retrieve and ground answers in the connected knowledge base with citations.' }],
    traits: ['knowledge-grounding'],
  },
  'mcp-tools': {
    skills: [{ name: 'tool-use', description: 'Call connected MCP tools to take actions and fetch live data.' }],
    mcpServers: [{ name: 'tools', transport: 'http', registry: true }],
    traits: ['mcp-tools'],
  },
  'data-persistence': {
    skills: [{ name: 'data-analysis', description: 'Read, query, and analyze structured records to answer data questions.' }],
    traits: ['data-persistence'],
  },
  storage: {
    skills: [{ name: 'file-handling', description: 'Work with uploaded files and stored documents.' }],
    traits: ['storage'],
  },
  'm365-graph': {
    skills: [{ name: 'm365-graph', description: 'Access Microsoft 365 data (mail, calendar, files) via Microsoft Graph.' }],
    mcpServers: [{ name: 'microsoft-graph', transport: 'http', registry: true }],
    traits: ['m365-graph'],
  },
  voice: { traits: ['voice'] },
  evals: { traits: ['evals'] },
  observability: { traits: ['observability'] },
  'identity-rbac': { traits: ['identity-rbac'] },
  'private-networking': { traits: ['private-networking'] },
  'ai-gateway': { traits: ['ai-gateway'] },
  'human-approval': { traits: ['human-approval'] },
  'containerized-agent': { traits: ['containerized-agent'] },
  'api-backend': { traits: ['api-backend'] },
};

// Skills used when a description yields no skill-bearing requirements, so the
// imported persona is never empty.
const DEFAULT_SKILLS: PersonaSkill[] = [
  { name: 'web-search', description: 'Search the public web for current information and cite sources.' },
  { name: 'document-summary', description: 'Summarize and extract key points from documents the user provides.' },
];

const SLUG_MAX = 64;

function deriveDisplayName(description: string, explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.trim();
  const firstLine = description.split(/\n/)[0]?.trim() ?? '';
  const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() ?? firstLine;
  const words = firstSentence.replace(/^(an?|the)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 6);
  const candidate = words.join(' ').replace(/[.!?,;:]+$/, '').trim();
  if (!candidate) return 'Custom Persona';
  return candidate.replace(/\b\w/g, c => c.toUpperCase());
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/^[^a-z0-9]+/, '')
      .slice(0, SLUG_MAX) || 'custom-persona'
  );
}

function buildInstructions(displayName: string, description: string): string {
  const trimmed = description.trim();
  return [
    `You are ${displayName}, an enterprise AI assistant.`,
    '',
    trimmed,
    '',
    'Operating guidance:',
    '- Reason → Act → Observe: plan an approach, use your skills and tools, inspect the results, and iterate until the request is fully answered.',
    '- Be concise and professional. Cite sources whenever you rely on grounded knowledge or web search.',
    '- Ask a clarifying question when a request is ambiguous or under-specified.',
  ].join('\n');
}

function buildSampleQuestions(displayName: string): string[] {
  return [
    'What can you help me with?',
    'Walk me through a typical task you handle.',
    'What information do you need from me to get started?',
  ].filter((q, i, arr) => arr.indexOf(q) === i && q !== displayName);
}

export interface BuildPersonaManifestArgs {
  /** Free-form natural-language description of the agent the user wants. */
  description: string;
  /** Optional explicit display name; otherwise derived from the description. */
  name?: string;
  /** Optional advisor selection ids to fold into requirement inference. */
  advisorSelections?: string[];
  /** Optional explicit requirement ids (e.g. from an advisor package). */
  requirementIds?: AdvisorRequirementId[];
}

export function buildPersonaManifest(args: BuildPersonaManifestArgs): PersonaManifest {
  const description = (args.description ?? '').trim();
  const displayName = deriveDisplayName(description, args.name);

  const requirementIds =
    args.requirementIds && args.requirementIds.length
      ? args.requirementIds
      : inferRequirementsFromSelections(args.advisorSelections ?? [], description);

  // Ensure the requirement ids are real (and de-duped) before mapping.
  const validIds = requirementsByIds(requirementIds).map(r => r.id);

  const skills: PersonaSkill[] = [];
  const mcpServers: PersonaMcpServer[] = [];
  const traits = new Set<string>();
  const seenSkill = new Set<string>();
  const seenMcp = new Set<string>();

  validIds.forEach(id => {
    const contrib = REQUIREMENT_CONTRIBUTIONS[id];
    if (!contrib) return;
    contrib.skills?.forEach(s => {
      if (seenSkill.has(s.name)) return;
      seenSkill.add(s.name);
      skills.push({ ...s });
    });
    contrib.mcpServers?.forEach(m => {
      if (seenMcp.has(m.name)) return;
      seenMcp.add(m.name);
      mcpServers.push({ ...m });
    });
    contrib.traits?.forEach(t => traits.add(t));
  });

  if (skills.length === 0) {
    DEFAULT_SKILLS.forEach(s => {
      seenSkill.add(s.name);
      skills.push({ ...s });
    });
  }

  // Threadlight traceability: tag each skill with a sequential BR id.
  const skillsWithTrace = skills.map((s, i) => ({
    ...s,
    implements: [`BR-${String(i + 1).padStart(3, '0')}`],
  }));

  const manifest: PersonaManifest = {
    name: displayName,
    displayName,
    description: description
      ? description.split(/\n/)[0]?.slice(0, 280)
      : `${displayName} — an imported Kratos persona.`,
    instructions: buildInstructions(displayName, description || `${displayName} helps users with their tasks.`),
    sampleQuestions: buildSampleQuestions(displayName),
    skills: skillsWithTrace,
    traits: [...traits].sort(),
    workflow_model: 'agent',
  };

  if (mcpServers.length) manifest.mcpServers = mcpServers;

  return manifest;
}

export function manifestToJson(manifest: PersonaManifest): string {
  return JSON.stringify(manifest, null, 2);
}
