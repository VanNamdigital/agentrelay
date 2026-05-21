import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'agentrelay_theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((value) => {
    if (value === 'dark' || value === 'light') setThemeState(value);
  }, []);

  const context = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
