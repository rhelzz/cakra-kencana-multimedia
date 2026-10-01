'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/theme';

/**
 * Minimal theme state — a local replacement for `next-themes`, which is
 * unmaintained and injects its boot script via `React.createElement('script')`,
 * tripping React 19's "script tag while rendering" error on Next 16.
 * Same API surface the app already uses (`resolvedTheme`, `setTheme`).
 */

type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function resolveTheme(theme: Theme): Resolved {
  if (theme !== 'system') return theme;
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches
    ? 'dark'
    : 'light';
}

function readStored(): Theme {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialisers read the stored choice during the first client render (the
  // blocking head script already painted the matching class, so this only syncs
  // React state — no visual change, no extra render pass from an effect).
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'system' : readStored(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<Resolved>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(readStored()),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  // Follow the OS while on `system`.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setResolvedTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Follow other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next: Theme =
        e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'system';
      setThemeState(next);
      setResolvedTheme(resolveTheme(next));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: keep it in memory for this tab.
    }
    setThemeState(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
