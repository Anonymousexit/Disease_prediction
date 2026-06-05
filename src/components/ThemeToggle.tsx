import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="size-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 flex items-center justify-center group"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="material-symbols-outlined text-xl group-hover:scale-110 transition-all duration-300"
        style={{ transform: dark ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
