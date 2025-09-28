import { useEffect } from 'react';
import { useDB } from '../../store/db';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n';

export function ThemeToggle() {
  const { db, setTheme } = useDB();
  const theme = db.settings.theme;
  const { t } = useLanguage();

  useEffect(() => {
    // Apply theme to document on mount and when theme changes
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) root.classList.add('dark');
      } else {
        root.classList.add(theme);
      }
    }
  }, [theme]);

  function toggle() {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  }

  const getLabel = () => {
    switch (theme) {
      case 'light': return t('darkMode');
      case 'dark': return t('systemMode'); 
      case 'system': return t('lightMode');
      default: return t('toggleTheme');
    }
  };

  return (
    <Button variant="secondary" onClick={toggle} aria-label={t('toggleTheme')}>
      {getLabel()}
    </Button>
  );
}
