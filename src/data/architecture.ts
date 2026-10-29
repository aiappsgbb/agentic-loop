import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, BookOpen, Brain, Building2, Database, Eye, GraduationCap, Headphones, ImageIcon, MessagesSquare, Network,
  Plug, Sparkles, ShieldCheck, UserCheck, Users, Volume2, Waypoints, Wrench,
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
    id: 'toolbox',
    label: 'Toolbox',
    caption: 'APIs, MCP tools, and business actions.',
    href: '/concepts/tools',
    icon: Wrench,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'toolbox' },
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
    id: 'ai-gateway',
    label: 'AI Gateway',
    caption: 'API Management for routing, quotas, caching, and policy.',
    href: '/concepts/platform/azure#ai-gateway',
    icon: Waypoints,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'ai-gateway' },
  },
  {
    id: 'observability',
    label: 'Observability',
    caption: 'Telemetry and insight across the full loop.',
    href: '/concepts/platform/azure#observability',
    icon: Eye,
    weight: 'complementary',
    selection: { field: 'buildingBlocks', id: 'observability' },
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
