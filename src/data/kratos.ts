export interface KratosPersona {
  id: string;
  name: string;
  skillCount: number;
  tagline: string;
  skills: string[];
}

/** Curated personas mirrored from the live Kratos app. */
export const KRATOS_PERSONAS: KratosPersona[] = [
  {
    id: 'generic-assistant',
    name: 'Generic Assistant',
    skillCount: 9,
    tagline: 'General-purpose enterprise AI assistant with web search, code execution, data analysis, and document skills.',
    skills: ['Web Search', 'Code Interpreter', 'Data Analysis', 'Document Summary', 'Docx Editor', 'Pptx Editor', 'Email Draft', 'Rag Search', 'File Sharing'],
  },
  {
    id: 'insurance-service-advisor',
    name: 'Insurance Service Advisor',
    skillCount: 9,
    tagline: 'Helps policyholders with claims, coverage questions, and policy servicing.',
    skills: ['Policy Lookup', 'Claims Status', 'Coverage Explainer', 'Document Summary', 'Rag Search', 'Web Search', 'Email Draft', 'Data Analysis', 'File Sharing'],
  },
  {
    id: 'retail-banking-assistant',
    name: 'Retail Banking Assistant',
    skillCount: 13,
    tagline: 'Supports everyday banking — accounts, payments, cards, and product guidance.',
    skills: ['Account Lookup', 'Transaction Search', 'Payments', 'Card Services', 'Fraud Check', 'Product Guidance', 'Rag Search', 'Web Search', 'Data Analysis', 'Document Summary', 'Email Draft', 'Docx Editor', 'File Sharing'],
  },
  {
    id: 'wealth-management-advisor',
    name: 'Wealth Management Advisor',
    skillCount: 10,
    tagline: 'Assists advisors with portfolios, planning, and branded client reports.',
    skills: ['Portfolio Analysis', 'Market Data', 'Wealth Report (PDF)', 'Data Analysis', 'Code Interpreter', 'Rag Search', 'Web Search', 'Document Summary', 'Pptx Editor', 'Email Draft'],
  },
];

export const KRATOS_STARTER_PROMPTS = [
  'Search the web for the latest AI trends in 2026 and summarize the top 5',
  'Find and analyze recent data on global cloud spending trends this year using visuals',
  'Search for the top programming languages in demand and compare their growth with charts',
  'Use web search to find current best practices for API design and summarize key insights',
];

/**
 * Mock assistant reply. No real model call — this fakes a Reason → Act → Observe
 * turn so the experience reads as live without any Kratos backend.
 */
export function mockKratosReply(persona: KratosPersona, prompt: string): {
  steps: { skill: string; note: string }[];
  answer: string;
} {
  const primarySkills = persona.skills.slice(0, 2);
  return {
    steps: [
      { skill: primarySkills[0] ?? 'Web Search', note: `Planning an approach for "${truncate(prompt, 60)}"` },
      { skill: primarySkills[1] ?? 'Data Analysis', note: 'Invoking skills and inspecting results' },
    ],
    answer:
      `Here's a mock response from the **${persona.name}**. In the live Kratos app this turn runs the ` +
      `Copilot SDK agentic loop — Reason → Act → Observe — calling MCP skills like ` +
      `${primarySkills.join(' and ')} to actually answer:\n\n` +
      `_"${truncate(prompt, 140)}"_\n\n` +
      `This embedded preview is a UI mock — connect it to the deployed Kratos hosted agent to make it real.`,
  };
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}
