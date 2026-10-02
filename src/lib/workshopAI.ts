import { validateAIProposal, type AnalysisRequest, type AIProposal } from '../data/workshop';

export function localAIEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_WORKSHOP_AI === 'local' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export async function requestWorkshopAnalysis(request: AnalysisRequest, signal: AbortSignal): Promise<AIProposal> {
  if (!localAIEnabled()) throw new Error('AI analysis is unavailable on this static portal. Run the documented local SDK companion, or continue with explicitly reviewed manual scope.');
  let response: Response;
  const deadline = AbortSignal.timeout(120_000);
  try {
    response = await fetch(`${import.meta.env.BASE_URL}api/workshop/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Workshop-Client': 'portal' },
      body: JSON.stringify(request),
      signal: AbortSignal.any([signal, deadline]),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (deadline.aborted) throw new Error('Local SDK analysis exceeded the browser deadline. No suggestions were applied.', { cause: error });
    throw new Error('The local SDK service is unavailable. Start npm run workshop:service and retry.', { cause: error });
  }
  let value: unknown;
  try { value = await response.json(); } catch {
    throw new Error('The local SDK service returned an invalid response. Nothing was applied.');
  }
  if (!response.ok) {
    const message = value && typeof value === 'object' && 'message' in value && typeof value.message === 'string'
      ? value.message : 'Local SDK analysis failed. Nothing was applied.';
    throw new Error(message);
  }
  return validateAIProposal(value, request);
}
