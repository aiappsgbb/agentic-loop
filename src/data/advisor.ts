import { playbooks, playbooksForScenario, type Playbook, type Scenario } from './links';

export type AdvisorPath = 'idea' | 'scenario';

export type AdvisorRequirementId =
  | 'evals'
  | 'voice'
  | 'private-networking'
  | 'observability'
  | 'knowledge-grounding'
  | 'ai-gateway'
  | 'identity-rbac'
  | 'storage'
  | 'data-persistence'
  | 'm365-graph'
  | 'mcp-tools'
  | 'web-search'
  | 'human-approval'
  | 'containerized-agent'
  | 'api-backend';

export interface AdvisorRequirement {
  id: AdvisorRequirementId;
  label: string;
  description: string;
  techniques: string[];
  buildSkills: string[];
  deploymentSkills: string[];
  tools: string[];
  architecture: string[];
}

export interface AdvisorPackage {
  path: AdvisorPath;
  intent: string;
  scenario?: Scenario;
  requirements: AdvisorRequirement[];
  playbooks: Playbook[];
  buildSkills: string[];
  deploymentSkills: string[];
  tools: string[];
  runArchitecture: string[];
  copilotPrompt: string;
  deploymentCommand: 'azd up';
}

export const DEFAULT_DEPLOYMENT_SKILLS = [
  'aigbb-azd-compliance',
  'bicep-azd-patterns',
  'containerization',
  'aigbb-azure-security',
  'aigbb-observability',
];

export const ADVISOR_REQUIREMENTS: AdvisorRequirement[] = [
  {
    id: 'evals',
    label: 'Evals',
    description: 'Regression gates, judge metrics, safety checks, and production-learning loops.',
    techniques: ['Observability', 'Predictive Analytics', 'Governance'],
    buildSkills: ['azure-ai-projects-py', 'pydantic-models-py'],
    deploymentSkills: ['aigbb-observability'],
    tools: ['Foundry Evals', 'evaluation datasets', 'judge model scoring'],
    architecture: ['Foundry Evals', 'Application Insights', 'OpenTelemetry traces'],
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Real-time speech-to-speech or voice-first interactions.',
    techniques: ['Real-Time Conversations', 'Frontier Models'],
    buildSkills: ['azure-ai-voicelive-py', 'agent-framework-azure-ai-py'],
    deploymentSkills: ['containerization', 'aigbb-observability'],
    tools: ['Azure AI Voice Live', 'function tools for actions'],
    architecture: ['Azure AI Voice Live', 'Foundry model deployment', 'WebSocket-capable app host'],
  },
  {
    id: 'private-networking',
    label: 'Private networking',
    description: 'Enterprise network isolation, private endpoints, and controlled egress.',
    techniques: ['Governance'],
    buildSkills: ['aigbb-azure-security'],
    deploymentSkills: ['bicep-azd-patterns', 'aigbb-azd-compliance'],
    tools: ['private endpoints', 'managed identity'],
    architecture: ['VNet integration', 'Private Endpoints', 'Key Vault', 'managed identity'],
  },
  {
    id: 'observability',
    label: 'Observability',
    description: 'Traces, metrics, structured logs, health checks, and feedback signals.',
    techniques: ['Observability'],
    buildSkills: ['azure-ai-projects-py'],
    deploymentSkills: ['aigbb-observability', 'aigbb-azd-compliance'],
    tools: ['OpenTelemetry instrumentation', 'health endpoints'],
    architecture: ['Application Insights', 'Log Analytics', 'OpenTelemetry'],
  },
  {
    id: 'knowledge-grounding',
    label: 'Knowledge grounding',
    description: 'Ground answers in enterprise content with retrieval, ACLs, and citations.',
    techniques: ['Knowledge Grounding', 'Forms Recognition'],
    buildSkills: ['azure-ai-projects-py', 'agent-framework-azure-ai-py', 'azure-storage-blob-py'],
    deploymentSkills: ['aigbb-azure-security'],
    tools: ['Azure AI Search', 'Foundry indexes', 'Blob-backed corpus'],
    architecture: ['Azure AI Search', 'Foundry project index', 'Azure Blob Storage'],
  },
  {
    id: 'ai-gateway',
    label: 'AI Gateway',
    description: 'Central routing, model governance, rate limits, caching, and policy enforcement.',
    techniques: ['Governance', 'Observability'],
    buildSkills: ['pydantic-models-py'],
    deploymentSkills: ['bicep-azd-patterns', 'aigbb-azure-security', 'aigbb-observability'],
    tools: ['AI Gateway policies', 'token limits', 'semantic cache'],
    architecture: ['Azure API Management as AI Gateway', 'policy-based model routing'],
  },
  {
    id: 'identity-rbac',
    label: 'Identity & RBAC',
    description: 'Use Entra ID, managed identity, and least-privilege role assignments.',
    techniques: ['Governance'],
    buildSkills: ['azure-identity-py', 'aigbb-azure-security'],
    deploymentSkills: ['bicep-azd-patterns', 'aigbb-azure-security'],
    tools: ['DefaultAzureCredential', 'managed identity', 'RBAC assignments'],
    architecture: ['Entra ID', 'User-assigned Managed Identity', 'Key Vault RBAC'],
  },
  {
    id: 'storage',
    label: 'Storage',
    description: 'Store uploaded files, generated artifacts, and grounding corpora.',
    techniques: ['Knowledge Grounding'],
    buildSkills: ['azure-storage-blob-py', 'azure-identity-py'],
    deploymentSkills: ['bicep-azd-patterns'],
    tools: ['BlobServiceClient', 'container lifecycle'],
    architecture: ['Azure Blob Storage', 'managed identity access'],
  },
  {
    id: 'data-persistence',
    label: 'Data persistence',
    description: 'Persist app or agent state only when the workflow needs durable state.',
    techniques: ['Workflow Automation'],
    buildSkills: ['pydantic-models-py', 'fastapi-router-py'],
    deploymentSkills: ['bicep-azd-patterns', 'aigbb-azure-security'],
    tools: ['typed data models', 'CRUD API routes'],
    architecture: ['Cosmos DB when state is required', 'stateless by default'],
  },
  {
    id: 'm365-graph',
    label: 'M365 / Graph',
    description: 'Connect work data, Teams/M365 channels, and Graph-backed workflows.',
    techniques: ['Workflow Automation', 'Knowledge Grounding'],
    buildSkills: ['m365-agents-py', 'mcp-builder'],
    deploymentSkills: ['aigbb-azure-security'],
    tools: ['Microsoft Graph connector', 'M365 Agents SDK'],
    architecture: ['M365 Agents SDK', 'Entra app permissions', 'Work IQ integration'],
  },
  {
    id: 'mcp-tools',
    label: 'MCP tools',
    description: 'Expose external systems through well-designed MCP tools.',
    techniques: ['Workflow Automation', 'Domain-Specific Agents'],
    buildSkills: ['mcp-builder', 'agent-framework-azure-ai-py', 'copilot-sdk'],
    deploymentSkills: ['containerization', 'aigbb-azd-compliance'],
    tools: ['FastMCP server', 'Foundry Tools connection'],
    architecture: ['Azure Container Apps MCP server', 'Foundry registered tool connection'],
  },
  {
    id: 'web-search',
    label: 'Web search',
    description: 'Let the agent retrieve current public information with citations.',
    techniques: ['Knowledge Grounding'],
    buildSkills: ['agent-framework-azure-ai-py', 'azure-ai-projects-py'],
    deploymentSkills: ['aigbb-observability'],
    tools: ['Foundry web search tool'],
    architecture: ['Foundry hosted web search with citation tracing'],
  },
  {
    id: 'human-approval',
    label: 'Human approval',
    description: 'Add approval gates before sensitive tool calls or production actions.',
    techniques: ['Governance', 'Workflow Automation'],
    buildSkills: ['copilot-sdk', 'agent-framework-azure-ai-py'],
    deploymentSkills: ['aigbb-azure-security', 'aigbb-observability'],
    tools: ['approval checkpoints', 'auditable tool calls'],
    architecture: ['policy gate before high-impact tools', 'trace-backed audit trail'],
  },
  {
    id: 'containerized-agent',
    label: 'Containerized custom agent',
    description: 'Run custom agent code as a Foundry hosted container agent.',
    techniques: ['Domain-Specific Agents'],
    buildSkills: ['agents-v2-py', 'hosted-agents-v2-py'],
    deploymentSkills: ['containerization', 'aigbb-azd-compliance', 'bicep-azd-patterns'],
    tools: ['ImageBasedHostedAgentDefinition', 'custom container image'],
    architecture: ['Foundry container-based hosted agent', 'Azure Container Registry'],
  },
  {
    id: 'api-backend',
    label: 'API backend',
    description: 'Expose custom app APIs around the agentic workflow.',
    techniques: ['Workflow Automation'],
    buildSkills: ['fastapi-router-py', 'pydantic-models-py'],
    deploymentSkills: ['containerization', 'aigbb-azd-compliance'],
    tools: ['FastAPI router', 'Pydantic contracts'],
    architecture: ['FastAPI on Azure Container Apps', 'CORS for local and cloud'],
  },
];

const requirementById = new Map(ADVISOR_REQUIREMENTS.map(r => [r.id, r]));

const selectionRequirementMap: Record<string, AdvisorRequirementId[]> = {
  'frontier-models': ['containerized-agent'],
  'text-to-speech': ['voice'],
  'speech-to-text': ['voice'],
  realtime: ['voice'],
  forms: ['knowledge-grounding', 'storage'],
  knowledge: ['knowledge-grounding'],
  observability: ['observability', 'evals'],
  integration: ['mcp-tools', 'api-backend'],
  'ai-gateway': ['ai-gateway'],
  identity: ['identity-rbac'],
  'private-net': ['private-networking'],
  data: ['data-persistence'],
  storage: ['storage'],
  workflow: ['mcp-tools', 'human-approval'],
  domain: ['containerized-agent'],
  'knowledge-grounding': ['knowledge-grounding'],
};

const textRequirementHints: Array<[RegExp, AdvisorRequirementId]> = [
  [/\b(eval|quality|regression|test)\b/i, 'evals'],
  [/\b(voice|speech|audio|conversation)\b/i, 'voice'],
  [/\b(private|vnet|network|endpoint)\b/i, 'private-networking'],
  [/\b(trace|monitor|observability|telemetry|logging)\b/i, 'observability'],
  [/\b(rag|ground|knowledge|document|citation|search)\b/i, 'knowledge-grounding'],
  [/\b(gateway|quota|rate limit|cache|policy)\b/i, 'ai-gateway'],
  [/\b(identity|rbac|entra|auth|permission)\b/i, 'identity-rbac'],
  [/\b(storage|blob|file|artifact)\b/i, 'storage'],
  [/\b(state|persist|database|cosmos|history)\b/i, 'data-persistence'],
  [/\b(m365|graph|teams|outlook|sharepoint)\b/i, 'm365-graph'],
  [/\b(mcp|tool|connector|integration)\b/i, 'mcp-tools'],
  [/\b(web search|current|public web|internet)\b/i, 'web-search'],
  [/\b(approval|human|review|sign[- ]?off)\b/i, 'human-approval'],
  [/\b(container|custom agent|hosted agent)\b/i, 'containerized-agent'],
  [/\b(api|backend|endpoint|fastapi)\b/i, 'api-backend'],
];

export function inferRequirementsFromSelections(ids: string[], text = ''): AdvisorRequirementId[] {
  const inferred = new Set<AdvisorRequirementId>();
  ids.forEach(id => selectionRequirementMap[id]?.forEach(req => inferred.add(req)));
  textRequirementHints.forEach(([pattern, id]) => {
    if (pattern.test(text)) inferred.add(id);
  });
  if (inferred.size === 0) {
    inferred.add('observability');
    inferred.add('identity-rbac');
  }
  return [...inferred];
}

export function requirementsByIds(ids: AdvisorRequirementId[]): AdvisorRequirement[] {
  return unique(ids).map(id => requirementById.get(id)).filter((r): r is AdvisorRequirement => Boolean(r));
}

export function buildAdvisorPackage(args: {
  path: AdvisorPath;
  intent: string;
  requirementIds: AdvisorRequirementId[];
  scenario?: Scenario;
}): AdvisorPackage {
  const requirements = requirementsByIds(args.requirementIds);
  const selectedPlaybooks = selectPlaybooks(requirements, args.scenario);
  const buildSkills = unique([
    'copilot-sdk',
    ...requirements.flatMap(r => r.buildSkills),
    ...selectedPlaybooks.flatMap(p => p.buildSkills ?? []),
  ]);
  const deploymentSkills = unique([
    ...DEFAULT_DEPLOYMENT_SKILLS,
    ...requirements.flatMap(r => r.deploymentSkills),
    ...selectedPlaybooks.flatMap(p => p.deploymentSkills ?? []),
  ]);
  const tools = unique(requirements.flatMap(r => r.tools));
  const runArchitecture = unique([
    'Microsoft Foundry Hosted Agents',
    'Foundry Models',
    ...requirements.flatMap(r => r.architecture),
  ]);

  const playbookList = selectedPlaybooks.map(p => `- ${p.name}: ${p.summary}`).join('\n');
  const requirementList = requirements.map(r => `- ${r.label}: ${r.description}`).join('\n');
  const buildSkillList = buildSkills.map(s => `- ${s}`).join('\n');
  const deploymentSkillList = deploymentSkills.map(s => `- ${s}`).join('\n');
  const architectureList = runArchitecture.map(a => `- ${a}`).join('\n');

  return {
    path: args.path,
    intent: args.intent.trim(),
    scenario: args.scenario,
    requirements,
    playbooks: selectedPlaybooks,
    buildSkills,
    deploymentSkills,
    tools,
    runArchitecture,
    deploymentCommand: 'azd up',
    copilotPrompt:
      `/lean:implement ${args.intent.trim()}\n\n` +
      `Respect the existing repository. Use the Agentic Loop playbook approach and produce an azd-deployable package.\n\n` +
      `Path: ${args.path === 'scenario' ? 'Scenario Advisor' : 'Production Launchpad'}\n` +
      (args.scenario ? `Scenario: ${args.scenario.name} (${args.scenario.industry})\n` : '') +
      `\nRequirements:\n${requirementList || '- Production-ready defaults'}\n\n` +
      `Selected playbooks:\n${playbookList || '- Getting started'}\n\n` +
      `Build SKILLs to use:\n${buildSkillList}\n\n` +
      `Deployment SKILLs to use:\n${deploymentSkillList}\n\n` +
      `Run architecture recommendations:\n${architectureList}\n\n` +
      `Deployment command: azd up`,
  };
}

function selectPlaybooks(requirements: AdvisorRequirement[], scenario?: Scenario): Playbook[] {
  const fromScenario = scenario ? playbooksForScenario(scenario) : [];
  const techniques = new Set(requirements.flatMap(r => r.techniques));
  const fromRequirements = playbooks.filter(p =>
    p.techniques.includes('*') || p.techniques.some(t => techniques.has(t))
  );
  const selected = uniqueBySlug([...fromScenario, ...fromRequirements]);
  return selected.length ? selected : playbooks.filter(p => p.slug === 'getting-started');
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function uniqueBySlug(items: Playbook[]): Playbook[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}
