export interface KratosPersona {
  id: string;
  /** Slug of the matching use-case in the live Kratos app (deep-link target). */
  kratosSlug: string;
  name: string;
  skillCount: number;
  tagline: string;
  skills: string[];
}

/** Curated personas mirrored from the live Kratos app. */
export const KRATOS_PERSONAS: KratosPersona[] = [
  {
    id: 'generic-assistant',
    kratosSlug: 'generic',
    name: 'Generic Assistant',
    skillCount: 9,
    tagline: 'General-purpose enterprise AI assistant with web search, code execution, data analysis, and document skills.',
    skills: ['Web Search', 'Code Interpreter', 'Data Analysis', 'Document Summary', 'Docx Editor', 'Pptx Editor', 'Email Draft', 'Rag Search', 'File Sharing'],
  },
  {
    id: 'insurance-service-advisor',
    kratosSlug: 'insurance',
    name: 'Insurance Service Advisor',
    skillCount: 9,
    tagline: 'Helps policyholders with claims, coverage questions, and policy servicing.',
    skills: ['Policy Lookup', 'Claims Status', 'Coverage Explainer', 'Document Summary', 'Rag Search', 'Web Search', 'Email Draft', 'Data Analysis', 'File Sharing'],
  },
  {
    id: 'retail-banking-assistant',
    kratosSlug: 'retail-banking',
    name: 'Retail Banking Assistant',
    skillCount: 13,
    tagline: 'Supports everyday banking — accounts, payments, cards, and product guidance.',
    skills: ['Account Lookup', 'Transaction Search', 'Payments', 'Card Services', 'Fraud Check', 'Product Guidance', 'Rag Search', 'Web Search', 'Data Analysis', 'Document Summary', 'Email Draft', 'Docx Editor', 'File Sharing'],
  },
  {
    id: 'wealth-management-advisor',
    kratosSlug: 'wealth-management',
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
