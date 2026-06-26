import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeCtx, type Resolved, type ThemeContextValue, type ThemePref } from './ThemeContext';

const KEY = 'agentic-loop-theme';

function getSystem(): Resolved {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as ThemePref | null;
    return stored ?? 'system';
  });
  const [systemTheme, setSystemTheme] = useState<Resolved>(() => getSystem());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => setSystemTheme(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved: Resolved = pref === 'system' ? systemTheme : pref;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const value = useMemo<ThemeContextValue>(() => ({
    pref,
    resolved,
    setPref: (p) => { setPrefState(p); localStorage.setItem(KEY, p); },
  }), [pref, resolved]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
