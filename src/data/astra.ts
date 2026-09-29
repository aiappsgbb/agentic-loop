const ASTRA_BASE = (import.meta.env.VITE_ASTRA_BASE || '/astra').replace(/\/+$/, '');

export function getAstraUrl(theme: 'light' | 'dark'): string {
  return `${ASTRA_BASE}/?scoutTheme=${theme}`;
}
