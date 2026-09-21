import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Shared sun/moon theme toggle used across panels.
 * Optional `className` / `variant` for layout-specific styling.
 */
export default function ThemeToggle({ className = '', variant = 'default' }) {
  const { isDark, toggleTheme } = useTheme();
  const [spinning, setSpinning] = useState(false);

  const onToggle = () => {
    setSpinning(true);
    toggleTheme();
    window.setTimeout(() => setSpinning(false), 400);
  };

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle--${variant}${spinning ? ' is-spinning' : ''}${className ? ` ${className}` : ''}`}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}
