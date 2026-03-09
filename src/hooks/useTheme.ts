import { useEffect } from 'react';

export function useTheme() {
  useEffect(() => {
    // Ensure light mode is always active
    document.documentElement.classList.remove('dark');
    localStorage.setItem('gatetrack-theme', 'light');
  }, []);

  return { isDark: false };
}
