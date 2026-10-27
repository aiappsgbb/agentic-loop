export const FOUNDRY_LOOP = {
  pluginUrl: 'https://github.com/github/awesome-copilot/tree/main/plugins/foundry-agentic-loop',
  installCommand: 'copilot plugin install foundry-agentic-loop@awesome-copilot',
  openPrompt: 'Open the agentic loop.',
};

export type BuildExecution = 'agentic-loop' | 'agentic-loop-rapid' | 'threadlight-pipeline';

export function buildWorkflowLabel(execution: BuildExecution): string {
  if (execution === 'threadlight-pipeline') return 'Threadlight pipeline';
  return execution === 'agentic-loop-rapid'
    ? 'Foundry Agentic Loop — Rapid prototyping (existing Foundry project)'
    : 'Foundry Agentic Loop — SDD (Specify → Implement → Verify → Deploy)';
}
