import { useEffect } from 'react';

/**
 * Light-only shim — keeps Guard CSS on light theme. No toggle.
 */
export function GuardThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return children;
}

export default null;
