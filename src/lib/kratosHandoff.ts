// Handoff from agentic-loop-site into the embedded Kratos app.
//
// Auth Variant B (locked): the site never calls the Kratos import API directly.
// It builds a threadlight-compatible PersonaManifest, relays it same-origin via
// sessionStorage, and full-page-navigates into `/kratos/?embed=1&import=1`.
// Kratos runs its own EasyAuth login, reads-and-clears the relayed manifest,
// POSTs it to its import endpoint (same-origin, no CORS), then settles on
// `?persona=<name>`.
//
// Because the relay is same-origin sessionStorage, the import handoff requires
// the site and Kratos to share a Front Door origin in production
// (site at `/`, Kratos at `/kratos/*`). In local dev, set
// VITE_KRATOS_STANDALONE_URL to point at a standalone Kratos; persona/prompt
// deep-links still work there, but the sessionStorage import relay only works
// when the two apps are same-origin.

import type { PersonaManifest } from '../data/manifest';

// Must match Kratos src/frontend/src/lib/embed.ts :: IMPORT_RELAY_KEY.
export const IMPORT_RELAY_KEY = 'kratos.import';

export type KratosTheme = 'light' | 'dark' | (string & {});
export type KratosMode = 'light' | 'dark';

// Named Kratos theme that mirrors the agentic-loop-site palette (aurora purple
// on near-black). Passing it on every open makes the embedded Kratos look like
// part of the host instead of Kratos' default newsprint theme.
const KRATOS_BRAND_THEME = 'agentic-loop';

// Same-origin host path the embedded Kratos "Back to Agentic Loop" button
// returns to (the curated/custom gallery page). Passed on every open so the
// sidebar back button lands the user back in the host experience.
const HOST_RETURN_PATH = '/reference/kratos';

/** The host's current light/dark mode, read from the site's <html data-theme>. */
function hostMode(): KratosMode {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function rawBase(): string {
  const standalone = import.meta.env.VITE_KRATOS_STANDALONE_URL as string | undefined;
  if (standalone && standalone.trim()) return standalone.trim();
  const base = (import.meta.env.VITE_KRATOS_BASE as string | undefined) ?? '/kratos';
  return base.trim() || '/kratos';
}

/** Resolved Kratos mount base, with any trailing slash stripped. */
export function getKratosBase(): string {
  return rawBase().replace(/\/+$/, '');
}

function buildUrl(params: Record<string, string | undefined>): string {
  const base = getKratosBase();
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, v);
  });
  const qs = search.toString();
  // Trailing slash before the query keeps Next.js basePath routing happy.
  return `${base}/${qs ? `?${qs}` : ''}`;
}

function go(url: string): void {
  // Full-page navigation (NOT react-router) — we are leaving the site SPA and
  // entering the embedded Kratos app, which must run its own auth + bootstrap.
  // With the Front Door path-mount this stays same-origin (host/kratos/...),
  // so the browser keeps showing the agentic-loop host, not a separate domain.
  window.location.assign(url);
}

export interface RelayOptions {
  theme?: KratosTheme;
  mode?: KratosMode;
}

/**
 * Relay a manifest into Kratos and open the embedded import flow.
 * Returns false if sessionStorage is unavailable (caller can surface an error).
 */
export function relayAndOpen(manifest: PersonaManifest, opts: RelayOptions = {}): boolean {
  try {
    window.sessionStorage.setItem(IMPORT_RELAY_KEY, JSON.stringify(manifest));
  } catch {
    return false;
  }
  go(buildUrl({
    embed: '1',
    import: '1',
    theme: opts.theme ?? KRATOS_BRAND_THEME,
    mode: opts.mode ?? hostMode(),
    back: HOST_RETURN_PATH,
  }));
  return true;
}

export interface OpenPersonaOptions {
  prompt?: string;
  theme?: KratosTheme;
  mode?: KratosMode;
}

/** Deep-link into an existing Kratos persona, optionally with a starter prompt. */
export function openPersona(personaSlug: string, opts: OpenPersonaOptions = {}): void {
  go(buildUrl({
    embed: '1',
    persona: personaSlug,
    prompt: opts.prompt,
    theme: opts.theme ?? KRATOS_BRAND_THEME,
    mode: opts.mode ?? hostMode(),
    back: HOST_RETURN_PATH,
  }));
}

/** Deep-link into Kratos with just a starter prompt (default persona). */
export function openPrompt(prompt: string, opts: { theme?: KratosTheme; mode?: KratosMode } = {}): void {
  go(buildUrl({
    embed: '1',
    prompt,
    theme: opts.theme ?? KRATOS_BRAND_THEME,
    mode: opts.mode ?? hostMode(),
    back: HOST_RETURN_PATH,
  }));
}
