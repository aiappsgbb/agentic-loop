import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, BookOpen, Brain, Building2, Database, Eye, GraduationCap, Headphones, ImageIcon, MessagesSquare, Network,
  Activity, Boxes, Globe, Plug, SlidersHorizontal, Sparkles, ShieldCheck, UserCheck, Users, Volume2, Waypoints, Wrench,
} from 'lucide-react';

export type ArchitectureSelectionField = 'capabilities' | 'buildingBlocks';
export type ArchitectureSelections = Record<ArchitectureSelectionField, readonly string[]>;
export type BrandIconName = 'copilot-sdk' | 'hosted-agent' | 'foundry-models';

export const FOUNDRY_MODELS = {
  auto: 'Auto',
  'gpt-6.1-sol': 'GPT-6.1 Sol',
  'gpt-6-luna': 'GPT-6 Luna',
  'claude-sonnet-5.5': 'Claude Sonnet 5.5',
} as const;
export type FoundryModelId = keyof typeof FOUNDRY_MODELS;

export function isFoundryModelId(value: string): value is FoundryModelId {
  return Object.hasOwn(FOUNDRY_MODELS, value);
}

export const MODEL_CAPABILITY_OPTIONS = [
  { id: 'image-generation', label: 'Image Generation', models: ['GPT-Image-2.5', 'MAI-Image-2.6'], icon: ImageIcon, link: '/concepts/platform/foundry#image-generation' },
  { id: 'text-to-speech', label: 'Text to Speech', models: ['MAI-Voice-2.1', 'GPT-Audio'], icon: Volume2, link: '/concepts/platform/foundry#text-to-speech' },
  { id: 'speech-to-text', label: 'Speech to Text', models: ['MAI-transcribe-2', 'GPT-transcribe'], icon: Headphones, link: '/concepts/platform/foundry#speech-to-text' },
  { id: 'realtime', label: 'Real-Time Conversations', models: ['gpt-live-1'], icon: MessagesSquare, link: '/concepts/platform/foundry#realtime' },
];

export const AGENT_CAPABILITY_OPTIONS = [
  { id: 'human-in-the-loop', label: 'Human-in-the-Loop', description: 'Approval before sensitive agent actions', icon: UserCheck },
  {
    id: 'agent-memory', label: 'Agent Memory',
    description: 'Retain approved context across sessions with Foundry memory (preview)',
    icon: Brain,
    buildGuidance: 'Implement Agent Memory using Foundry Agent Service memory stores (preview) to retain approved context across conversations. Follow https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/memory-usage. Validate preview availability, current SDK/API support, chat and embedding model deployments, managed identity/RBAC and compatibility with the selected hosted-agent harness before implementation; do not silently switch harnesses or invent support. Create a dedicated memory store for the agent and integrate supported memory search/update operations. Derive per-user memory scope from authenticated identity on the trusted backend; never trust a client-supplied user ID or share memory across users. Confirm what may be remembered, retention/TTL and explicit remember/forget behavior; exclude secrets and sensitive data. Verify recall across separate conversations, cross-user isolation, expiration and deletion before pilot use. Confirm billable resources and any required scope changes before provisioning.',
  },
  { id: 'domain', label: 'Domain-Specific Agents', description: 'Use Skills for domain-specific tasks; linked to Skills above', icon: Building2 },
  { id: 'knowledge-grounding', label: 'Knowledge Grounding', description: 'Ground answers in trusted enterprise data; linked to Foundry IQ above', icon: GraduationCap },
  { id: 'multi-agent', label: 'Multi-Agent Orchestration', description: 'Coordinated agent teams', icon: Users },
];

export interface WorkshopSelections extends ArchitectureSelections {
  patterns: readonly string[];
}

export const AGENT_CAPABILITY_LINKS: Partial<Record<string, { field: ArchitectureSelectionField; id: string }>> = {
  'knowledge-grounding': { field: 'capabilities', id: 'knowledge' },
  domain: { field: 'buildingBlocks', id: 'agent-skills' },
};

export interface ArchitectureNode {
  id: string;
  label: string;
  caption: string;
  href: string;
  icon: LucideIcon;
  weight: 'spine' | 'complementary' | 'foundation';
  buildGuidance?: string;
  brandIcon?: BrandIconName;
  selection?: {
    field: ArchitectureSelectionField;
    id: string;
    label?: string;
    caption?: string;
  };
}

export const SPINE_NODES: ArchitectureNode[] = [
  {
    id: 'github-copilot-sdk',
    label: 'GitHub Copilot SDK',
    caption: 'Agent Loop runtime that binds skills, tools, and model calls.',
    href: '/concepts/agentic-loop',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'copilot-sdk',
  },
  {
    id: 'hosted-agent',
    label: 'Hosted Agent',
    caption: 'Foundry runtime where skills execute and tools are invoked under policy.',
    href: '/concepts/agents',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'hosted-agent',
  },
  {
    id: 'foundry-model',
    label: 'Foundry Models',
    caption: 'Frontier and open models behind the agent loop.',
    href: '/concepts/platform/foundry#frontier-models',
    icon: Sparkles,
    weight: 'spine',
    brandIcon: 'foundry-models',
  },
];

export const COMPLEMENTARY_NODES: ArchitectureNode[] = [
  {
    id: 'foundry-iq',
    label: 'Foundry IQ',
    caption: 'Grounded knowledge, connectors, and retrieval.',
    href: '/concepts/platform/foundry#foundry-iq',
    icon: BookOpen,
    weight: 'complementary',
    selection: { field: 'capabilities', id: 'knowledge' },
  },
  {
    id: 'work-iq',
    label: 'Work IQ',
    caption: 'Organisational memory from Microsoft 365 signals.',
    href: '/concepts/platform/foundry#work-iq',
    icon: Plug,
    weight: 'complementary',
    selection: { field: 'capabilities', id: 'work-iq' },
  },
  {
    id: 'fabric-iq',
    label: 'Fabric IQ',
    caption: 'Business semantics and ontologies over OneLake.',
    href: '/concepts/platform/foundry#fabric-iq',
    icon: Database,
    weight: 'complementary',
    selection: { field: 'capabilities', id: 'fabric-iq' },
  },
  {
    id: 'web-iq',
    label: 'WebIQ',
    caption: 'Current public-web search and grounding with source citations.',
    href: '/concepts/platform/foundry#web-iq',
    icon: Globe,
    weight: 'complementary',
    selection: { field: 'capabilities', id: 'web-iq' },
    buildGuidance: 'Use Microsoft Web IQ for current public-web search and grounding with source URLs and provenance. Validate the paid Azure subscription, service access, Web IQ AppID/Entra authentication and the supported MCP connection; Azure credits do not cover Web IQ. Expose it through the governed Foundry toolbox MCP endpoint. Do not invent an endpoint, transmit private customer data in search queries, or substitute Foundry IQ private-knowledge retrieval. Documentation: https://learn.microsoft.com/web-iq/overview',
  },
  {
    id: 'toolbox',
    label: 'MCP',
    caption: 'APIs, MCP tools and business actions through a governed Foundry toolbox.',
    href: '/concepts/tools',
    icon: Wrench,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'toolbox' },
    buildGuidance: 'MCP is the workshop label for the existing governed Foundry toolbox integration. Keep versioned connections, centralized authentication and the single toolbox MCP endpoint; this label change does not request direct, ungoverned MCP server connections.',
  },
  {
    id: 'evals',
    label: 'Evaluations',
    caption: 'Quality, safety, and cost checks on traces.',
    href: '/concepts/platform/foundry#evaluations',
    icon: BarChart3,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'evals' },
  },
  {
    id: 'observability',
    label: 'Tracing',
    caption: 'Telemetry and insight across the full loop.',
    href: '/concepts/platform/azure#observability',
    icon: Eye,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'observability' },
    buildGuidance: 'Trace backend requests, hosted-agent turns, model calls and MCP tool calls with OpenTelemetry into the selected Application Insights resource. Preserve correlation and redact sensitive content; do not enable raw prompt, completion or tool-content capture without approval.',
  },
  {
    id: 'agent-optimizer',
    label: 'Agent Optimizer',
    caption: 'Compare evaluated configuration candidates against a measured agent baseline.',
    href: '/concepts/platform/foundry#agent-optimizer',
    icon: SlidersHorizontal,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'agent-optimizer' },
    buildGuidance: 'Use Foundry Agent Optimizer with an explicit baseline, representative evaluation dataset, criteria and supported evaluation/optimization models. For hosted agents, validate optimizer-ready configuration and Responses protocol support. Review cost and use safe test tools because evaluations can execute real tool calls. Compare candidate quality and token usage; applying a candidate or redeploying requires approval. Validate current availability before promising support. Documentation: https://learn.microsoft.com/azure/foundry/agents/concepts/agent-optimizer-overview',
  },
  {
    id: 'agent-insights',
    label: 'Agent Insights',
    caption: 'Analyze agent traces for evidence-backed issues and proposed improvements.',
    href: '/concepts/platform/foundry#agent-insights',
    icon: Activity,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'agent-insights' },
    buildGuidance: 'Use Foundry Agent Insights (preview) to analyze representative agent traces and review findings with linked evidence. Validate preview access, telemetry, permissions, supported judge models and analysis scope. Reading existing insights is read-only; starting scans, creating monitors, changing status or applying proposed fixes requires separate approval. Confirm findings before making changes and do not silently enable extra services or sensitive content capture. Documentation: https://learn.microsoft.com/azure/foundry/observability/how-to/agent-insights',
  },
];

export const SKILLS_NODE: ArchitectureNode = {
  id: 'agent-skills',
  label: 'Skills',
  caption: 'Reusable instructions and expertise for domain-specific agent tasks.',
  href: '/concepts/skills',
  icon: Sparkles,
  weight: 'complementary',
  selection: { field: 'buildingBlocks', id: 'agent-skills' },
};

export const FOUNDATION_NODES: ArchitectureNode[] = [
  {
    id: 'ai-gateway',
    label: 'AI Gateway',
    caption: 'API Management for routing, quotas, caching, and policy.',
    href: '/concepts/platform/azure#ai-gateway',
    icon: Waypoints,
    weight: 'foundation',
    selection: { field: 'buildingBlocks', id: 'ai-gateway' },
  },
  {
    id: 'container-apps',
    label: 'Azure Container Apps',
    caption: 'Frontend and backend app hosting; the agent remains hosted in Foundry.',
    href: '/concepts/platform/azure#container-apps',
    icon: Boxes,
    weight: 'foundation',
    selection: { field: 'buildingBlocks', id: 'container-apps' },
    buildGuidance: 'Host the frontend and backend on Azure Container Apps (ACA); keep the agent on Foundry Hosted Agents. Validate ingress, streaming, health checks, managed identities, scaling and cost for the confirmed scope. ACA is a removable starting default, not a mandatory agent runtime. If it is deselected, do not reintroduce ACA from a guide example or build-mode default; confirm alternative app hosting before provisioning or deployment.',
  },
  {
    id: 'entra-rbac',
    label: 'Entra / RBAC',
    caption: 'Identity, scopes, and managed access.',
    href: '/concepts/platform/azure#identity',
    icon: ShieldCheck,
    weight: 'foundation',
    selection: { field: 'buildingBlocks', id: 'identity', label: 'Identity & Access' },
  },
  {
    id: 'app-insights',
    label: 'App Insights',
    caption: 'Application traces and live diagnostics.',
    href: '/concepts/platform/azure#observability',
    icon: Eye,
    weight: 'foundation',
    selection: { field: 'buildingBlocks', id: 'app-insights' },
  },
  {
    id: 'networking',
    label: 'Networking',
    caption: 'Private endpoints, VNets, and hybrid reach.',
    href: '/concepts/platform/azure#private-net',
    icon: Network,
    weight: 'foundation',
    selection: { field: 'buildingBlocks', id: 'private-net', label: 'Private Networking' },
  },
];

export const ARCHITECTURE_NODES = [...SPINE_NODES, ...COMPLEMENTARY_NODES, SKILLS_NODE, ...FOUNDATION_NODES];

export function canonicalArchitectureLabel(label: string): string {
  if (label === 'Toolbox') return 'MCP';
  if (label === 'Observability') return 'Tracing';
  return label;
}

export const ARCHITECTURE_OPTIONS = ARCHITECTURE_NODES.flatMap(node => node.selection ? [{
  field: node.selection.field,
  id: node.selection.id,
  label: node.selection.label ?? node.label,
  description: node.selection.caption ?? node.caption,
  icon: node.icon,
  link: node.href,
}] : []);

export const WORKSHOP_CAPABILITY_OPTIONS = [
  { id: 'frontier-models', label: 'Frontier Models', description: 'Reasoning models for the agent backbone', icon: Brain },
  ...MODEL_CAPABILITY_OPTIONS.map(option => ({ ...option, description: option.models.join(' or ') })),
  ...ARCHITECTURE_OPTIONS.filter(option => option.field === 'capabilities'),
];

export function normalizeWorkshopSelections(selections: WorkshopSelections) {
  const capabilities = new Set(selections.capabilities.filter(id => id !== 'forms'));
  const buildingBlocks = new Set(selections.buildingBlocks.filter(id =>
    !['content-safety', 'key-vault', 'ai-search', 'data', 'storage'].includes(id)));
  for (const id of selections.patterns) {
    const linked = AGENT_CAPABILITY_LINKS[id];
    if (linked) (linked.field === 'capabilities' ? capabilities : buildingBlocks).add(linked.id);
  }
  return {
    capabilities: [...capabilities],
    buildingBlocks: [...buildingBlocks],
    patterns: selections.patterns.filter(id => id !== 'workflow' && !AGENT_CAPABILITY_LINKS[id]),
  };
}

export function withObservability(blocks: readonly string[]): string[] {
  return [...new Set(blocks.includes('observability') ? [...blocks, 'app-insights'] : blocks)];
}

export function selectedArchitecture(selections: ArchitectureSelections): string[] {
  const buildingBlocks = withObservability(selections.buildingBlocks);
  return ARCHITECTURE_NODES
    .filter(node => node.weight === 'spine' ||
      node.selection && (node.selection.field === 'buildingBlocks' ? buildingBlocks : selections.capabilities).includes(node.selection.id))
    .map(node => node.selection?.label ?? node.label);
}
