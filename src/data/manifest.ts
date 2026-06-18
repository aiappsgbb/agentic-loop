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
    skills: [{ name: 'rag-search', description: 'Retrieve and ground answers in the connected knowledge base, with citations.' }],
    traits: ['knowledge-grounding'],
  },
  'mcp-tools': {
    skills: [{ name: 'tool-use', description: 'Call connected MCP tools to take actions and fetch live data.' }],
    traits: ['mcp-tools'],
  },
  'data-persistence': {
    skills: [{ name: 'data-analysis', description: 'Read, query, and analyze structured records to answer data questions.' }],
    traits: ['data-persistence'],
  },
  storage: {
    skills: [{ name: 'file-sharing', description: 'Work with uploaded files and share generated documents as downloads.' }],
    traits: ['storage'],
  },
  'm365-graph': {
    skills: [{ name: 'm365-graph', description: 'Access Microsoft 365 data (mail, calendar, files) via Microsoft Graph.' }],
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

// Per-skill copy used to make the generated persona read and behave like the
// curated, hand-authored Kratos personas: a "You help with" bullet and a
// concrete, capability-anchored sample question. Keyed by the skill `name`
// produced above so the persona's instructions and starter prompts always
// match the skills it actually carries.
interface CapabilityProfile {
  help: string;
  sample?: (topic: string) => string;
}

const CAPABILITY_PROFILES: Record<string, CapabilityProfile> = {
  'web-search': {
    help: 'Research current information from the public web and cite your sources',
    sample: t => `Search the web for the latest on ${t} and summarize the key takeaways with sources.`,
  },
  'rag-search': {
    help: 'Answer questions grounded in your connected knowledge base, with citations',
    sample: t => `What do our internal documents say about ${t}?`,
  },
  'data-analysis': {
    help: 'Analyze structured data and surface trends, with charts when useful',
    sample: t => `Analyze our recent ${t} data and show the main trend in a chart.`,
  },
  'tool-use': {
    help: 'Take actions and fetch live data through your connected tools',
    sample: t => `Use your connected tools to look up ${t} and tell me the next step.`,
  },
  'file-sharing': {
    help: 'Work with uploaded files and produce downloadable documents',
    sample: () => 'Summarize a document I share and export the key points as a downloadable file.',
  },
  'm365-graph': {
    help: 'Connect to Microsoft 365 data such as mail, calendar, and files',
    sample: t => `Check my Microsoft 365 inbox and flag anything related to ${t}.`,
  },
  'document-summary': {
    help: 'Summarize documents and pull out the key points',
    sample: () => 'Summarize a document I share and list the key points.',
  },
};

const SLUG_MAX = 64;

// Connector/relative words that signal the end of a clean role name, e.g.
// "claims assistant for auto insurance" → "Claims Assistant".
const NAME_BOUNDARY = new Set([
  'that', 'which', 'who', 'whom', 'whose', 'to', 'for', 'and', 'or', 'with',
  'when', 'where', 'so', 'of', 'in', 'on', 'using', 'via', 'by',
]);

// Role nouns that make a clean persona name; when one appears early in the
// description, the name ends there (inclusive) — e.g. "claims assistant for
// auto insurance" → "Claims Assistant".
const ROLE_NOUN_LIST = [
  'assistant', 'advisor', 'concierge', 'helper', 'agent', 'bot', 'copilot',
  'analyst', 'manager', 'specialist', 'expert', 'service', 'desk', 'guide',
  'companion', 'coach', 'planner', 'navigator', 'broker',
];
const ROLE_NOUN_SET = new Set(ROLE_NOUN_LIST);
const ROLE_NOUNS = new RegExp(`\\b(${ROLE_NOUN_LIST.join('|')})\\b`, 'gi');

// Leading verbs/articles/objects stripped so a verb-lead description like
// "Helps the ops team summarize reports" yields a usable topic/name.
const LEADING_FILLER = /^(?:an?|the|please|it|this|that|i|we)\s+/i;
const LEADING_VERB = /^(?:helps?|assists?|automates?|manages?|handles?|answers?|supports?|guides?|provides?|delivers?|enables?|lets?|allows?|gives?|is|acts?\s+as|serves?\s+as|works?\s+as|analy[sz]es?|summari[sz]es?|reviews?|tracks?|monitors?|generates?|creates?|builds?|finds?|searches?|looks?|processes?|classifies?|categori[sz]es?|drafts?|writes?|researches?|schedules?|plans?|recommends?|detects?)\s+/i;
const LEADING_OBJECT = /^(?:the|a|an|our|my|your|their|users?|team|customers?|people|clients?|staff|employees?|me)\s+/i;

// Strip leading verbs/articles/objects to expose the core subject phrase, then
// keep up to `maxWords` words, stopping at a connector/boundary word so we
// don't grab "and surface…" tails.
function corePhrase(text: string, maxWords: number): string {
  let phrase = text.replace(LEADING_FILLER, '').replace(LEADING_VERB, '');
  let prev = '';
  while (phrase !== prev) {
    prev = phrase;
    phrase = phrase.replace(LEADING_OBJECT, '');
  }
  const picked: string[] = [];
  for (const word of phrase.split(/\s+/).filter(Boolean)) {
    const bare = word.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (picked.length >= 1 && NAME_BOUNDARY.has(bare)) break;
    picked.push(word);
    if (picked.length >= maxWords) break;
  }
  return picked
    .join(' ')
    .replace(ROLE_NOUNS, '')
    .replace(/[.!?,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveDisplayName(description: string, explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.trim();
  const firstLine = description.split(/\n/)[0]?.trim() ?? '';
  const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() ?? firstLine;
  const stripped = firstSentence.replace(LEADING_FILLER, '');

  // Preferred: the description already names a role — end the name there.
  const raw = stripped.split(/\s+/).filter(Boolean);
  const picked: string[] = [];
  let foundRole = false;
  for (const word of raw) {
    const bare = word.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (picked.length >= 2 && NAME_BOUNDARY.has(bare)) break;
    picked.push(word);
    if (ROLE_NOUN_SET.has(bare)) { foundRole = true; break; }
    if (picked.length >= 6) break;
  }
  if (foundRole) {
    const candidate = picked.join(' ').replace(/[.!?,;:]+$/, '').trim();
    return candidate.replace(/\b\w/g, c => c.toUpperCase());
  }

  // No role noun: build "<Subject> Assistant" from a short core subject phrase.
  const subject = corePhrase(stripped, 2);
  if (!subject) return 'Custom Persona';
  const titled = subject.replace(/\b\w/g, c => c.toUpperCase());
  return /\bassistant\b/i.test(titled) ? titled : `${titled} Assistant`;
}

// Derive a short, in-sentence topic noun (e.g. "mortgage onboarding") for
// sample questions, cleaned of leading verbs/objects and trailing role nouns.
function deriveTopic(displayName: string, description: string): string {
  const fromName = corePhrase(displayName, 4);
  if (fromName.length >= 3) return fromName.toLowerCase();
  const firstSentence = description.split(/(?<=[.!?])\s/)[0] ?? description;
  const fromDesc = corePhrase(firstSentence, 4);
  return (fromDesc || 'your area of focus').toLowerCase();
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

function buildInstructions(
  displayName: string,
  description: string,
  skills: PersonaSkill[],
  traits: Set<string>,
): string {
  const trimmed = description.trim();
  const lines: string[] = [`You are ${displayName}, a specialized AI assistant.`, ''];

  if (trimmed) {
    lines.push(trimmed, '');
  }

  const helps = skills
    .map(s => CAPABILITY_PROFILES[s.name]?.help)
    .filter((h): h is string => Boolean(h));
  if (helps.length) {
    lines.push('You help with:');
    helps.forEach(h => lines.push(`- ${h}.`));
    lines.push('');
  }

  if (skills.length) {
    lines.push('Using your skills — reach for them whenever they are relevant instead of answering from memory:');
    skills.forEach(s => lines.push(`- **${s.name}** — ${(s.description ?? '').trim()}`.trimEnd()));
    lines.push('');
  }

  lines.push('How you work:');
  lines.push('- Reason → Act → Observe: plan an approach, use your skills and tools, inspect the results, and iterate until the request is fully answered.');
  lines.push('- Ground every claim. Cite sources whenever you rely on retrieved knowledge or web search, and keep internal data clearly separate from external information.');
  lines.push('- Ask a clarifying question when a request is ambiguous or under-specified.');
  if (traits.has('human-approval')) {
    lines.push('- Pause and request explicit human approval before any sensitive, irreversible, or final action.');
  }
  lines.push('');

  lines.push('Tone & personality:');
  lines.push('- Professional, precise, and concise. Explain things in plain language and stay operationally reliable.');

  return lines.join('\n');
}

function buildSampleQuestions(topic: string, skills: PersonaSkill[], traits: Set<string>): string[] {
  const questions = ['What can you help me with?'];
  skills.forEach(s => {
    const sample = CAPABILITY_PROFILES[s.name]?.sample;
    if (sample) questions.push(sample(topic));
  });
  if (traits.has('human-approval')) {
    questions.push(`Start a ${topic} task and pause for my approval before anything is finalized.`);
  }
  const unique = [...new Set(questions)];
  if (unique.length === 1) {
    unique.push(
      'Walk me through a typical task you handle.',
      'What information do you need from me to get started?',
    );
  }
  return unique.slice(0, 5);
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

  const topic = deriveTopic(displayName, description);

  const manifest: PersonaManifest = {
    name: displayName,
    displayName,
    description: description
      ? description.split(/\n/)[0]?.slice(0, 280)
      : `${displayName} — an imported Kratos persona.`,
    instructions: buildInstructions(
      displayName,
      description || `${displayName} helps users with their tasks.`,
      skills,
      traits,
    ),
    sampleQuestions: buildSampleQuestions(topic, skills, traits),
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
