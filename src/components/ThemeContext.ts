import { createContext } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

export interface ThemeContextValue {
  pref: ThemePref;
  resolved: Resolved;
  setPref: (p: ThemePref) => void;
}

export const ThemeCtx = createContext<ThemeContextValue | null>(null);
