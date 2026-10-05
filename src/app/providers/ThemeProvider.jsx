import { useEffect } from 'react';

const THEME_KEY = 'fs-theme';

/** Light-only — no dark mode / theme toggle. */
export default function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.setItem(THEME_KEY, 'light');
    } catch {
      /* ignore */
    }
  }, []);

  return children;
}
