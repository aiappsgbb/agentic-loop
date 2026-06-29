import {
  Boxes, Sparkles, Network, Eye, BarChart3, Database, MessageSquare,
  KeyRound, ShieldCheck, FileCheck2, Rocket, Plug,
  Code as Github,
  Wand2, Briefcase, TrendingUp, AlertTriangle, Share2, FileText, Newspaper, ScrollText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface BuildSkill {
  /** Skill folder name — matches `skills/<id>/SKILL.md` in the repo and the route param. */
  id: string;
  /** Display name. */
  name: string;
  /** GitHub repository that hosts the skill, in `owner/repo` form. */
  repo: string;
  /** Short summary (the catalog trigger) shown on the card. */
  description: string;
  category: string;
  icon: LucideIcon;
}

/**
 * Build-phase skills suggested by the `agentic-loop` skill catalog.
 * Source: agentic-loop/skills/agentic-loop/references/build-skills-catalog.md
 */
export const BUILD_SKILLS: BuildSkill[] = [
  {
    id: 'microsoft-foundry',
    name: 'Microsoft Foundry',
    repo: 'microsoft/azure-skills',
    description: 'Microsoft Foundry — the default for every agentic-loop spec. Declares hosted agents, models, and projects.',
    category: 'Foundry',
    icon: Boxes,
  },
  {
    id: 'microsoft-agent-framework',
    name: 'Microsoft Agent Framework',
    repo: 'github/awesome-copilot',
    description: 'Build MAF agents — basic agents plus graph and workflow orchestration.',
    category: 'Agent Framework',
    icon: Network,
  },
  {
    id: 'copilot-sdk',
    name: 'Copilot SDK',
    repo: 'github/awesome-copilot',
    description: 'GitHub Copilot SDK for skill-using or integrated-loop agents — BYOK Foundry models, invocations protocol.',
    category: 'Agent Framework',
    icon: Github,
  },
  {
    id: 'python-mcp-server-generator',
    name: 'Python MCP Server Generator',
    repo: 'github/awesome-copilot',
    description: 'Scaffold a Python MCP server with FastMCP and streamable HTTP.',
    category: 'Tools',
    icon: Plug,
  },
  {
    id: 'azure-ai',
    name: 'Azure AI',
    repo: 'microsoft/azure-skills',
    description: 'AI Search, vector / hybrid / semantic search, Document Intelligence / OCR, and Speech / STT / TTS.',
    category: 'AI Services',
    icon: Sparkles,
  },
  {
    id: 'azure-aigateway',
    name: 'Azure AI Gateway',
    repo: 'microsoft/azure-skills',
    description: 'API Management for model / tool / agent routing, semantic caching, content safety, token limits, and MCP governance.',
    category: 'Gateway',
    icon: Network,
  },
  {
    id: 'appinsights-instrumentation',
    name: 'App Insights Instrumentation',
    repo: 'microsoft/azure-skills',
    description: 'Application Insights SDK setup — telemetry instrumentation, traces, metrics, and app monitoring.',
    category: 'Observability',
    icon: Eye,
  },
  {
    id: 'azure-kusto',
    name: 'Azure Kusto',
    repo: 'microsoft/azure-skills',
    description: 'KQL analytics, Azure Data Explorer, Log Analytics-style telemetry exploration, and time-series analysis.',
    category: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'azure-storage',
    name: 'Azure Storage',
    repo: 'microsoft/azure-skills',
    description: 'Blob / File / Data Lake storage for grounding data, uploads, durable artifacts, and document landing zones.',
    category: 'Storage',
    icon: Database,
  },
  {
    id: 'azure-messaging',
    name: 'Azure Messaging',
    repo: 'microsoft/azure-skills',
    description: 'Service Bus, Event Hubs, async business actions, event ingestion, queues, and topics.',
    category: 'Messaging',
    icon: MessageSquare,
  },
  {
    id: 'entra-app-registration',
    name: 'Entra App Registration',
    repo: 'microsoft/azure-skills',
    description: 'Microsoft Graph / OAuth app registration, delegated auth, API permissions, and MSAL integration.',
    category: 'Identity',
    icon: KeyRound,
  },
  {
    id: 'entra-agent-id',
    name: 'Entra Agent ID',
    repo: 'microsoft/azure-skills',
    description: 'Entra Agent Identity, agent OAuth, OBO, workload identity federation, and cross-tenant agent auth.',
    category: 'Identity',
    icon: KeyRound,
  },
  {
    id: 'azure-rbac',
    name: 'Azure RBAC',
    repo: 'microsoft/azure-skills',
    description: 'Least-privilege Azure RBAC role selection, role assignments, and managed identity permissions.',
    category: 'Security',
    icon: ShieldCheck,
  },
  {
    id: 'azure-prepare',
    name: 'Azure Prepare',
    repo: 'microsoft/azure-skills',
    description: 'Azure app deployment scaffold — azure.yaml, Bicep / Terraform, and Dockerfiles for cloud deployment.',
    category: 'Deployment',
    icon: Boxes,
  },
  {
    id: 'azure-validate',
    name: 'Azure Validate',
    repo: 'microsoft/azure-skills',
    description: 'Pre-deployment readiness — Bicep / Terraform validation, RBAC checks, what-if analysis, and config preflight.',
    category: 'Deployment',
    icon: FileCheck2,
  },
  {
    id: 'azure-deploy',
    name: 'Azure Deploy',
    repo: 'microsoft/azure-skills',
    description: 'Execute an already-prepared deployment with azd / Bicep / Terraform, with deployment error recovery.',
    category: 'Deployment',
    icon: Rocket,
  },
];

export function getBuildSkill(id: string): BuildSkill | undefined {
  return BUILD_SKILLS.find(s => s.id === id);
}

/** GitHub web URL for the skill folder. */
export function skillRepoUrl(skill: BuildSkill | RunSkill): string {
  return `https://github.com/${skill.repo}/tree/main/skills/${skill.id}`;
}

/** Raw SKILL.md URL used to fetch and render the skill content. */
export function skillRawUrl(skill: BuildSkill | RunSkill): string {
  return `https://raw.githubusercontent.com/${skill.repo}/main/skills/${skill.id}/SKILL.md`;
}

/** GitHub CLI command to install the skill. */
export function skillInstallCommand(skill: BuildSkill | RunSkill): string {
  return `gh skill install ${skill.repo} ${skill.id}`;
}

export interface RunSkill {
  /** Skill folder name — matches `skills/<id>/SKILL.md` and the named-skill trigger. */
  id: string;
  /** Display name. */
  name: string;
  /** GitHub repository in `owner/repo` form, or '' when the skill has no published repo. */
  repo: string;
  /** Reuse trigger — what the prompt must explicitly name for this skill to be reused. */
  description: string;
  category: string;
  icon: LucideIcon;
}

/**
 * Run-phase skills the agent itself runs at execution time. Reuse — don't regenerate —
 * when the prompt explicitly names one of these.
 * Source: agentic-loop/skills/agentic-loop/references/run-skills-catalog.md
 */
export const RUN_SKILLS: RunSkill[] = [
  {
    id: 'eyeball',
    name: 'Eyeball',
    repo: 'github/awesome-copilot',
    description: 'Visually inspect a rendered UI or screenshot and report what is on screen or off-spec.',
    category: 'Review',
    icon: Eye,
  },
  {
    id: 'finalize-agent-prompt',
    name: 'Finalize Agent Prompt',
    repo: 'github/awesome-copilot',
    description: "Polish and finalize an agent's system / instruction prompt.",
    category: 'Prompting',
    icon: Wand2,
  },
  {
    id: 'gtm-enterprise-account-planning',
    name: 'GTM Enterprise Account Planning',
    repo: '',
    description: 'Build an enterprise go-to-market account plan.',
    category: 'Go-to-market',
    icon: Briefcase,
  },
  {
    id: 'gtm-product-led-growth',
    name: 'GTM Product-Led Growth',
    repo: '',
    description: 'Plan a product-led-growth (PLG) go-to-market motion.',
    category: 'Go-to-market',
    icon: TrendingUp,
  },
  {
    id: 'incident-postmortem',
    name: 'Incident Postmortem',
    repo: 'github/awesome-copilot',
    description: 'Draft a structured incident postmortem — timeline, impact, root cause, action items.',
    category: 'Operations',
    icon: AlertTriangle,
  },
  {
    id: 'linkedin-post-formatter',
    name: 'LinkedIn Post Formatter',
    repo: '',
    description: 'Format content into a LinkedIn-ready post.',
    category: 'Content',
    icon: Share2,
  },
  {
    id: 'md-to-docx',
    name: 'Markdown to DOCX',
    repo: 'github/awesome-copilot',
    description: 'Convert Markdown into a DOCX document.',
    category: 'Documents',
    icon: FileText,
  },
  {
    id: 'roundup',
    name: 'Roundup',
    repo: 'github/awesome-copilot',
    description: 'Summarize multiple sources or items into a single roundup.',
    category: 'Content',
    icon: Newspaper,
  },
  {
    id: 'tldr-prompt',
    name: 'TL;DR Prompt',
    repo: 'github/awesome-copilot',
    description: 'Produce a concise TL;DR summary of long content.',
    category: 'Content',
    icon: ScrollText,
  },
];

export function getRunSkill(id: string): RunSkill | undefined {
  return RUN_SKILLS.find(s => s.id === id);
}

/** Look up a skill in either catalog. */
export function getSkill(id: string): { skill: BuildSkill | RunSkill; phase: 'build' | 'run' } | undefined {
  const build = getBuildSkill(id);
  if (build) return { skill: build, phase: 'build' };
  const run = getRunSkill(id);
  if (run) return { skill: run, phase: 'run' };
  return undefined;
}
